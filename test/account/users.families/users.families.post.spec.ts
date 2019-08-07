import request from 'supertest'
import { expect } from 'chai'
import { Institution } from '../../../src/account-service/model/institution'
import { acc } from '../../utils/account.utils'
import { accountDB } from '../../../src/account-service/database/account.db'
import { ApiGatewayException } from '../../utils/api.gateway.exceptions'
import { Child } from '../../../src/account-service/model/child'
import { Family } from '../../../src/account-service/model/family'

describe('Routes: users.families', () => {

    const URI: string = process.env.AG_URL || 'https://localhost:8081'

    let accessTokenAdmin: string
    let accessTokenChild: string
    let accessTokenEducator: string
    let accessTokenHealthProfessional: string
    let accessTokenFamily: string
    let accessTokenApplication: string

    const defaultInstitution: Institution = new Institution()
    defaultInstitution.type = 'default type'
    defaultInstitution.name = 'default name'
    defaultInstitution.address = 'default address'
    defaultInstitution.latitude = 0
    defaultInstitution.longitude = 0

    const defaultChild: Child = new Child
    defaultChild.username = 'default child'
    defaultChild.password = 'default pass'
    defaultChild.gender = 'male'
    defaultChild.age = 11

    const defaultFamily: Family = new Family()
    defaultFamily.username = 'default family'
    defaultFamily.password = 'default pass'
    
    before(async () => {
        try {
            await accountDB.connect()

            const tokens = await acc.getAuths()
            accessTokenAdmin = tokens.admin.access_token
            accessTokenChild = tokens.child.access_token
            accessTokenEducator = tokens.educator.access_token
            accessTokenHealthProfessional = tokens.health_professional.access_token
            accessTokenFamily = tokens.family.access_token
            accessTokenApplication = tokens.application.access_token

            await accountDB.removeCollections()

            const resultInstitution = await acc.saveInstitution(accessTokenAdmin, defaultInstitution)
            defaultInstitution.id = resultInstitution.id

            defaultChild.institution = defaultInstitution
            defaultFamily.institution = defaultInstitution
            defaultFamily.children = new Array<Child>(defaultChild)

            const resultChild = await acc.saveChild(accessTokenAdmin, defaultChild)
            defaultChild.id = resultChild.id

        } catch (err) {
            console.log('Failure on Before from users.families.post test: ', err)
        }
    })

    after(async () => {
        try {
            await accountDB.removeCollections()
            await accountDB.dispose()
        } catch (err) {
            console.log('DB ERROR', err)
        }
    })

    describe('POST /users/families', () => {
        afterEach(async () => {
            try {
                await accountDB.deleteAllFamilies()
            } catch (err) {
                console.log('Failure in users.families.patch test: ', err)
            }
        })
        context('when the admin posting a new family user', () => {
            it('families.post001: should return status code 201 and the saved family', () => {

                return request(URI)
                    .post('/users/families')
                    .send(defaultFamily.toJSON())
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(201)
                    .then(res => {
                        expect(res.body).to.have.property('id')
                        expect(res.body.username).to.eql(defaultFamily.username)
                        expect(res.body.institution).to.have.property('id')
                        expect(res.body.institution.type).to.eql(defaultInstitution.type)
                        expect(res.body.institution.name).to.eql(defaultInstitution.name)
                        expect(res.body.institution.address).to.eql(defaultInstitution.address)
                        expect(res.body.institution.latitude).to.eql(defaultInstitution.latitude)
                        expect(res.body.institution.longitude).to.eql(defaultInstitution.longitude)
                        expect(res.body.children[0]).to.have.property('id')
                        expect(res.body.children[0]).to.have.property('institution')
                        expect(res.body.children[0]).to.have.property('username', defaultChild.username)
                        expect(res.body.children[0]).to.have.property('gender', defaultChild.gender)
                        expect(res.body.children[0]).to.have.property('age', defaultChild.age)
                        expect(res.body.children[0].institution).to.have.property('id')
                        expect(res.body.children[0].institution).to.have.property('type', defaultInstitution.type)
                        expect(res.body.children[0].institution).to.have.property('name', defaultInstitution.name)
                        expect(res.body.children[0].institution).to.have.property('address', defaultInstitution.address)
                        expect(res.body.children[0].institution).to.have.property('latitude', defaultInstitution.latitude)
                        expect(res.body.children[0].institution).to.have.property('longitude', defaultInstitution.longitude)
                    })
            })
        })

        describe('when a duplicate error occurs', () => {
            before(async () => {
                try {
                    await acc.saveFamily(accessTokenAdmin, defaultFamily)
                } catch (err) {
                    console.log('Failure in users.families test: ', err)
                }
            })
            it('families.post002: should return status code 409 and message info about family is already registered', () => {

                return request(URI)
                    .post('/users/families')
                    .send(defaultFamily.toJSON())
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(409)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.FAMILY.ERROR_409_DUPLICATE)
                    })
            })
        })

        context('when a validation error occurs', () => {
            it('families.post003: should return status code 400 and message info about missing parameters, because username was not provided', () => {

                const body = {
                    password: defaultFamily.password,
                    children: new Array<string | undefined>(defaultChild.id),
                    institution_id: defaultInstitution.id
                }

                return request(URI)
                    .post('/users/families')
                    .send(body)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.FAMILY.ERROR_400_USERNAME_NOT_PROVIDED)
                    })
            })

            it('families.post004: should return status code 400 and message info about missing parameters, because password was not provided', () => {

                const body = {
                    username: defaultFamily.username,
                    children: new Array<string | undefined>(defaultChild.id),
                    institution_id: defaultInstitution.id
                }

                return request(URI)
                    .post('/users/families')
                    .send(body)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.FAMILY.ERROR_400_PASSWORD_NOT_PROVIDED)
                    })
            })

            it('families.post005: should return status code 400 and info message from missing parameters, because children not provided', () => {
                const body = {
                    username: defaultFamily.username,
                    password: defaultFamily.password,
                    institution_id: defaultInstitution.id
                }

                return request(URI)
                    .post('/users/families')
                    .send(body)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.FAMILY.ERROR_400_CHILDREN_IS_REQUIRED)
                    })
            })

            it('families.post006: should return status code 400 and info message from invalid parameters, because children does not exist', () => {

                const NON_EXISTENT_CHILD_ID: any = '111a1a11aaa11aa111111111'

                const body = {
                    username: defaultFamily.username,
                    children: new Array<string | undefined>(NON_EXISTENT_CHILD_ID),
                    password: defaultFamily.password,
                    institution_id: defaultInstitution.id
                }

                return request(URI)
                    .post('/users/families')
                    .send(body)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        const EXPECTED_RESPONSE = ApiGatewayException.FAMILY.ERROR_400_CHILDREN_NOT_REGISTERED
                        EXPECTED_RESPONSE.description += ' '.concat(NON_EXISTENT_CHILD_ID)
                        expect(err.body).to.eql(EXPECTED_RESPONSE)
                    })
            })

            it('families.post007: should return status code 400 and info message from children id(ids) is invalid', () => {
                const body = {
                    username: defaultFamily.username,
                    children: new Array<string | undefined>(acc.INVALID_ID),
                    password: defaultFamily.password,
                    institution_id: defaultInstitution.id
                }

                return request(URI)
                    .post('/users/families')
                    .send(body)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_400_INVALID_FORMAT_ID)
                        // caso o ID contenha caracteres numéricos e alfabéticos (ex: 5a) o erro retornado é correto
                    })
            })

            it('families.post008: should return status code 400 and info message about missing parameters, because institution was not provided', () => {
                const body = {
                    username: defaultFamily.username,
                    children: new Array<string | undefined>(defaultChild.id),
                    password: defaultFamily.password
                }

                return request(URI)
                    .post('/users/families')
                    .send(body)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.FAMILY.ERROR_400_INSTITUTION_NOT_PROVIDED)
                    })
            })

            it('families.post009: should return status code 400 and message from institution not found', () => {
                const body = {
                    username: defaultFamily.username,
                    children: new Array<string | undefined>(defaultChild.id),
                    password: defaultFamily.password,
                    institution_id: acc.NON_EXISTENT_ID
                }

                return request(URI)
                    .post('/users/families')
                    .send(body)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.INSTITUTION.ERROR_400_INSTITUTION_NOT_REGISTERED)
                    })

            })

            it('families.post010: should return status code 400 and message for invalid institution id', () => {
                const body = {
                    username: defaultFamily.username,
                    children: new Array<string | undefined>(defaultChild.id),
                    password: defaultFamily.password,
                    institution_id: acc.INVALID_ID
                }

                return request(URI)
                    .post('/users/families')
                    .send(body)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_400_INVALID_FORMAT_ID)
                    })
            })

        }) // validation error occurs

        context('when the user does not have permission to register the family', () => {

            it('families.post011: should return status code 403 and info message from insufficient permissions for child user', () => {
                return request(URI)
                    .post('/users/families')
                    .send(defaultFamily.toJSON())
                    .set('Authorization', 'Bearer '.concat(accessTokenChild))
                    .set('Content-Type', 'application/json')
                    .expect(403)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                    })
            })

            it('families.post012: should return status code 403 and info message from insufficient permissions for educator user', () => {
                return request(URI)
                    .post('/users/families')
                    .send(defaultFamily.toJSON())
                    .set('Authorization', 'Bearer '.concat(accessTokenEducator))
                    .set('Content-Type', 'application/json')
                    .expect(403)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                    })
            })

            it('families.post013: should return status code 403 and info message from insufficient permissions for health professional user', () => {
                return request(URI)
                    .post('/users/families')
                    .send(defaultFamily.toJSON())
                    .set('Authorization', 'Bearer '.concat(accessTokenHealthProfessional))
                    .set('Content-Type', 'application/json')
                    .expect(403)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                    })
            })

            it('families.post014: should return status code 403 and info message from insufficient permissions for family user', () => {
                return request(URI)
                    .post('/users/families')
                    .send(defaultFamily.toJSON())
                    .set('Authorization', 'Bearer '.concat(accessTokenFamily))
                    .set('Content-Type', 'application/json')
                    .expect(403)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                    })
            })

            it('families.post015: should return status code 403 and info message from insufficient permissions for application user', () => {
                return request(URI)
                    .post('/users/families')
                    .send(defaultFamily.toJSON())
                    .set('Authorization', 'Bearer '.concat(accessTokenApplication))
                    .set('Content-Type', 'application/json')
                    .expect(403)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                    })
            })

        }) // user does not have permission 

        describe('when not informed the acess token', () => {
            it('families.post016: should return the status code 401 and the authentication failure informational message', () => {

                return request(URI)
                    .post('/users/families')
                    .send(defaultFamily.toJSON())
                    .set('Authorization', 'Bearer ')
                    .set('Content-Type', 'application/json')
                    .expect(401)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.AUTH.ERROR_401_UNAUTHORIZED)
                    })
            })
        })
    })
})