import request from 'supertest'
import { expect } from 'chai'
import { acc } from '../../utils/account.utils'
import { accountDB } from '../../../src/account-service/database/account.db'
import { trck } from '../../utils/tracking.utils'
import { trackingDB } from '../../../src/tracking-service/database/tracking.db'
import { ApiGatewayException } from '../../utils/api.gateway.exceptions'
import { Institution } from '../../../src/account-service/model/institution'
import { Child } from '../../../src/account-service/model/child'
import { ChildMock } from '../../mocks/account-service/child.mock'
import { Educator } from '../../../src/account-service/model/educator'
import { EducatorMock } from '../../mocks/account-service/educator.mock'
import { HealthProfessional } from '../../../src/account-service/model/health.professional'
import { HealthProfessionalMock } from '../../mocks/account-service/healthprofessional.mock'
import { Family } from '../../../src/account-service/model/family'
import { FamilyMock } from '../../mocks/account-service/family.mock'
import { BodyFatMock } from '../../mocks/tracking-service/body.fat.mock'
import { BodyFat } from '../../../src/tracking-service/model/body.fat'
import { ChildrenGroup } from '../../../src/account-service/model/children.group'
import { ChildrenGroupMock } from '../../mocks/account-service/children.group.mock'

describe('Routes: children.bodyfats', () => {

    const URI: string = process.env.AG_URL || 'https://localhost:8081/v1'

    let accessTokenAdmin: string
    let accessTokenChild: string
    let accessTokenEducator: string
    let accessTokenHealthProfessional: string
    let accessTokenFamily: string
    let accessTokenApplication: string

    let accessDefaultChildToken: string
    let accessDefaultEducatorToken: string
    let accessDefaultHealthProfessionalToken: string
    let accessDefaultFamilyToken: string

    const defaultInstitution: Institution = new Institution()
    defaultInstitution.type = 'default type'
    defaultInstitution.name = 'default name'
    defaultInstitution.address = 'default address'
    defaultInstitution.latitude = 0
    defaultInstitution.longitude = 0

    const defaultChild: Child = new ChildMock()
    const defaultEducator: Educator = new EducatorMock()
    const defaultHealthProfessional: HealthProfessional = new HealthProfessionalMock()
    const defaultFamily: Family = new FamilyMock()

    const defaultChildrenGroup: ChildrenGroup = new ChildrenGroupMock()

    const BODY_FATS_ARRAY: Array<BodyFat> = new Array()

    before(async () => {
        try {
            await accountDB.connect()
            await trackingDB.connect()

            const tokens = await acc.getAuths()
            accessTokenAdmin = tokens.admin.access_token
            accessTokenChild = tokens.child.access_token
            accessTokenEducator = tokens.educator.access_token
            accessTokenHealthProfessional = tokens.health_professional.access_token
            accessTokenFamily = tokens.family.access_token
            accessTokenApplication = tokens.application.access_token

            const resultDefaultInstitution = await acc.saveInstitution(accessTokenAdmin, defaultInstitution)
            defaultInstitution.id = resultDefaultInstitution.id
            defaultChild.institution = resultDefaultInstitution
            defaultEducator.institution = resultDefaultInstitution
            defaultHealthProfessional.institution = resultDefaultInstitution
            defaultFamily.institution = resultDefaultInstitution

            const resultDefaultChild = await acc.saveChild(accessTokenAdmin, defaultChild)
            defaultChild.id = resultDefaultChild.id

            // Associating the child
            defaultChildrenGroup.children = new Array<Child>(resultDefaultChild)
            defaultFamily.children = new Array<Child>(resultDefaultChild)

            // registering default users
            const resultDefaultEducator = await acc.saveEducator(accessTokenAdmin, defaultEducator)
            defaultEducator.id = resultDefaultEducator.id

            const resultDefaultHealthProfessional = await acc.saveHealthProfessional(accessTokenAdmin, defaultHealthProfessional)
            defaultHealthProfessional.id = resultDefaultHealthProfessional.id

            const resultDefaultFamily = await acc.saveFamily(accessTokenAdmin, defaultFamily)
            defaultFamily.id = resultDefaultFamily.id

            // getting default users token
            if (defaultChild.username && defaultChild.password) {
                accessDefaultChildToken = await acc.auth(defaultChild.username, defaultChild.password)
            }

            if (defaultEducator.username && defaultEducator.password) {
                accessDefaultEducatorToken = await acc.auth(defaultEducator.username, defaultEducator.password)
            }

            if (defaultHealthProfessional.username && defaultHealthProfessional.password) {
                accessDefaultHealthProfessionalToken = await acc.auth(defaultHealthProfessional.username, defaultHealthProfessional.password)
            }

            if (defaultFamily.username && defaultFamily.password) {
                accessDefaultFamilyToken = await acc.auth(defaultFamily.username, defaultFamily.password)
            }

            // associate children groups
            await acc.saveChildrenGroupsForEducator(accessDefaultEducatorToken, defaultEducator, defaultChildrenGroup)
            await acc.saveChildrenGroupsForHealthProfessional(accessDefaultHealthProfessionalToken, defaultHealthProfessional, defaultChildrenGroup)

        } catch (err) {
            console.log('Failure on Before from bodyfats.get_all test: ', err.message)
        }
    })
    after(async () => {
        try {
            await accountDB.removeCollections()
            await trackingDB.removeCollections()
            await accountDB.dispose()
            await trackingDB.dispose()
        } catch (err) {
            console.log('DB ERROR', err)
        }
    })

    describe('GET /children/:child_id/bodyfats', () => {
        let AMOUNT: number

        beforeEach(async () => {
            try {
                BODY_FATS_ARRAY.length = 0 // clear BODY_FATS_ARRAY
                AMOUNT = await Math.floor(Math.random() * 6 + 10) // 10-15 (the amount of body fats can change for each test case)

                // The first bodyfat saved is the last one returned
                for (let i = (AMOUNT - 1); i >= 0; i--) {
                    BODY_FATS_ARRAY[i] = await trck.saveBodyFat(accessDefaultChildToken, new BodyFatMock(), defaultChild.id)
                }

            } catch (err) {
                console.log('Failure in bodyfats.get_all test: ', err.message)
            }
        })
        afterEach(async () => {
            try {
                await trackingDB.deleteMeasurements()
            } catch (err) {
                console.log('Failure in bodyfats.get_all test: ', err.message)
            }
        })

        context('when the user get all body fats of the child successfully', () => {

            it('bodyfats.get_all001: should return status code 201 and a list with all body fats of the child for admin user', () => {

                return request(URI)
                    .get(`/children/${defaultChild.id}/bodyfats`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(AMOUNT)
                        BODY_FATS_ARRAY.forEach(function (bodyfat, index) {
                            expect(res.body[index]).to.have.property('id', bodyfat.id)
                            expect(res.body[index]).to.have.property('timestamp', bodyfat.timestamp)
                            expect(res.body[index]).to.have.property('value', bodyfat.value)
                            expect(res.body[index]).to.have.property('unit', bodyfat.unit)
                            expect(res.body[index]).to.have.property('child_id', bodyfat.child_id)
                        })
                    })
            })

            it('bodyfats.get_all002: should return status code 201 and a list with all body fats of the child himself', () => {

                return request(URI)
                    .get(`/children/${defaultChild.id}/bodyfats`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer '.concat(accessDefaultChildToken))
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(AMOUNT)

                        BODY_FATS_ARRAY.forEach(function (bodyfat, index) {
                            expect(res.body[index]).to.have.property('id', bodyfat.id)
                            expect(res.body[index]).to.have.property('timestamp', bodyfat.timestamp)
                            expect(res.body[index]).to.have.property('value', bodyfat.value)
                            expect(res.body[index]).to.have.property('unit', bodyfat.unit)
                            expect(res.body[index]).to.have.property('child_id', bodyfat.child_id)
                        })
                    })
            })

            it('bodyfats.get_all003: should return status code 201 and a list with all body fats of the child for educator user', () => {

                return request(URI)
                    .get(`/children/${defaultChild.id}/bodyfats`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer '.concat(accessDefaultEducatorToken))
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(AMOUNT)

                        BODY_FATS_ARRAY.forEach(function (bodyfat, index) {
                            expect(res.body[index]).to.have.property('id', bodyfat.id)
                            expect(res.body[index]).to.have.property('timestamp', bodyfat.timestamp)
                            expect(res.body[index]).to.have.property('value', bodyfat.value)
                            expect(res.body[index]).to.have.property('unit', bodyfat.unit)
                            expect(res.body[index]).to.have.property('child_id', bodyfat.child_id)
                        })
                    })
            })

            it('bodyfats.get_all004: should return status code 201 and a list with all body fats of the child for health professional user', () => {

                return request(URI)
                    .get(`/children/${defaultChild.id}/bodyfats`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer '.concat(accessDefaultHealthProfessionalToken))
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(AMOUNT)

                        BODY_FATS_ARRAY.forEach(function (bodyfat, index) {
                            expect(res.body[index]).to.have.property('id', bodyfat.id)
                            expect(res.body[index]).to.have.property('timestamp', bodyfat.timestamp)
                            expect(res.body[index]).to.have.property('value', bodyfat.value)
                            expect(res.body[index]).to.have.property('unit', bodyfat.unit)
                            expect(res.body[index]).to.have.property('child_id', bodyfat.child_id)
                        })
                    })
            })

            it('bodyfats.get_all005: should return status code 201 and a list with all body fats of the child for family user', () => {

                return request(URI)
                    .get(`/children/${defaultChild.id}/bodyfats`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer '.concat(accessDefaultFamilyToken))
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(AMOUNT)

                        BODY_FATS_ARRAY.forEach(function (bodyfat, index) {
                            expect(res.body[index]).to.have.property('id', bodyfat.id)
                            expect(res.body[index]).to.have.property('timestamp', bodyfat.timestamp)
                            expect(res.body[index]).to.have.property('value', bodyfat.value)
                            expect(res.body[index]).to.have.property('unit', bodyfat.unit)
                            expect(res.body[index]).to.have.property('child_id', bodyfat.child_id)
                        })
                    })
            })

            it('bodyfats.get_all006: should return status code 201 and a list with all body fats of the child for application user', () => {

                return request(URI)
                    .get(`/children/${defaultChild.id}/bodyfats`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer '.concat(accessTokenApplication))
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(AMOUNT)

                        BODY_FATS_ARRAY.forEach(function (bodyfat, index) {
                            expect(res.body[index]).to.have.property('id', bodyfat.id)
                            expect(res.body[index]).to.have.property('timestamp', bodyfat.timestamp)
                            expect(res.body[index]).to.have.property('value', bodyfat.value)
                            expect(res.body[index]).to.have.property('unit', bodyfat.unit)
                            expect(res.body[index]).to.have.property('child_id', bodyfat.child_id)
                        })
                    })
            })

            context('when get all body fats with some specification', () => {

                it('bodyfats.get_all007: should return status code 200 and a list with the ten most recently registered body fats', () => {

                    const PAGE = 1
                    const LIMIT = 10

                    return request(URI)
                        .get(`/children/${defaultChild.id}/bodyfats?page=${PAGE}&limit=${LIMIT}`)
                        .set('Content-Type', 'application/json')
                        .set('Authorization', 'Bearer '.concat(accessTokenApplication))
                        .expect(200)
                        .then(res => {
                            expect(res.body.length).to.eql(LIMIT)
                            for (let i = 0; i < LIMIT; i++) {
                                expect(res.body[i]).to.have.property('id', BODY_FATS_ARRAY[i].id)
                                expect(res.body[i]).to.have.property('timestamp', BODY_FATS_ARRAY[i].timestamp)
                                expect(res.body[i]).to.have.property('value', BODY_FATS_ARRAY[i].value)
                                expect(res.body[i]).to.have.property('unit', BODY_FATS_ARRAY[i].unit)
                                expect(res.body[i]).to.have.property('child_id', BODY_FATS_ARRAY[i].child_id)
                            }
                        })
                })

                it('bodyfats.get_all008: should return status code 200 and a list with all body fats sorted by least timestamp', () => {

                    // Sort body fats by great timestamp
                    BODY_FATS_ARRAY.sort(function (w1, w2) {
                        return w1.timestamp! < w2.timestamp! ? -1 : 1
                    })

                    const SORT = 'timestamp'

                    return request(URI)
                        .get(`/children/${defaultChild.id}/bodyfats?sort=${SORT}`)
                        .set('Content-Type', 'application/json')
                        .set('Authorization', 'Bearer '.concat(accessTokenApplication))
                        .expect(200)
                        .then(res => {
                            expect(res.body.length).to.eql(AMOUNT)
                            for (let i = 0; i < AMOUNT; i++) {
                                expect(res.body[i]).to.have.property('id', BODY_FATS_ARRAY[i].id)
                                expect(res.body[i]).to.have.property('timestamp', BODY_FATS_ARRAY[i].timestamp)
                                expect(res.body[i]).to.have.property('value', BODY_FATS_ARRAY[i].value)
                                expect(res.body[i]).to.have.property('unit', BODY_FATS_ARRAY[i].unit)
                                expect(res.body[i]).to.have.property('child_id', BODY_FATS_ARRAY[i].child_id)
                            }
                        })
                })

                it('bodyfats.get_all009: should return status code 200 and a list with five body fats sorted by large value', () => {

                    // Sort body fats by large value
                    BODY_FATS_ARRAY.sort(function (w1, w2) {
                        return w1.value! > w2.value! ? -1 : 1
                    })

                    const PAGE = 1
                    const LIMIT = 5
                    const SORT = 'value'

                    return request(URI)
                        .get(`/children/${defaultChild.id}/bodyfats?page=${PAGE}&limit=${LIMIT}&sort=-${SORT}`)
                        .set('Content-Type', 'application/json')
                        .set('Authorization', 'Bearer '.concat(accessTokenApplication))
                        .expect(200)
                        .then(res => {
                            expect(res.body.length).to.eql(LIMIT)
                            for (let i = 0; i < LIMIT; i++) {
                                expect(res.body[i]).to.have.property('id', BODY_FATS_ARRAY[i].id)
                                expect(res.body[i]).to.have.property('timestamp', BODY_FATS_ARRAY[i].timestamp)
                                expect(res.body[i]).to.have.property('value', BODY_FATS_ARRAY[i].value)
                                expect(res.body[i]).to.have.property('unit', BODY_FATS_ARRAY[i].unit)
                                expect(res.body[i]).to.have.property('child_id', BODY_FATS_ARRAY[i].child_id)
                            }
                        })
                })

                it('bodyfats.get_all010: should return status code 200 and a empty list', async () => {

                    await trackingDB.deleteMeasurements()

                    return request(URI)
                        .get(`/children/${defaultChild.id}/bodyfats`)
                        .set('Content-Type', 'application/json')
                        .set('Authorization', 'Bearer '.concat(accessTokenApplication))
                        .expect(200)
                        .then(res => {
                            expect(res.body.length).to.eql(0)
                        })
                })
            })

        }) //user get all body fats of a child successfully

        context('when a validation error occurs', () => {
            it('bodyfats.get_all011: should return status code 400 and info message from child_id is invalid', () => {

                const INVALID_ID = '123'

                return request(URI)
                    .get(`/children/${INVALID_ID}/bodyfats`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .expect(400)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.BODYFATS.ERROR_400_INVALID_CHILD_ID)
                    })
            })
        })

        describe('when not informed the acess token', () => {
            it('bodyfats.get_all013: should return the status code 401 and the authentication failure informational message', () => {

                return request(URI)
                    .get(`/children/${defaultChild.id}/bodyfats`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer ')
                    .expect(401)
                    .then(err => {
                        expect(err.body).to.eql(ApiGatewayException.AUTH.ERROR_401_UNAUTHORIZED)
                    })
            })
        })

        context('when the user does not have permission for get all physical activities', () => {

            describe('when a child get all body fats of other child', () => {
                it('physical.activities.get_id012: should return the status code 403 and info message from insufficient permissions', () => {

                    return request(URI)
                        .get(`/children/${defaultChild.id}/bodyfats`)
                        .set('Authorization', 'Bearer '.concat(accessTokenChild))
                        .set('Content-Type', 'application/json')
                        .expect(403)
                        .then(err => {
                            expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                        })
                })
            })

            describe('when the child does not belong to any of the groups associated with the educator', () => {
                it('physical.activities.get_id016: should return status code 403 and info message from insufficient permissions for educator user who is not associated with the child', () => {

                    return request(URI)
                        .get(`/children/${defaultChild.id}/bodyfats`)
                        .set('Authorization', 'Bearer '.concat(accessTokenEducator))
                        .set('Content-Type', 'application/json')
                        .expect(403)
                        .then(err => {
                            expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                        })
                })
            })

            describe('when the child does not belong to any of the groups associated with the health professional', () => {
                it('physical.activities.get_id017: should return status code 403 and info message from insufficient permissions for health professional user who is not associated with the child', () => {

                    return request(URI)
                        .get(`/children/${defaultChild.id}/bodyfats`)
                        .set('Authorization', 'Bearer '.concat(accessTokenHealthProfessional))
                        .set('Content-Type', 'application/json')
                        .expect(403)
                        .then(err => {
                            expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                        })
                })
            })

            describe('when the child is not associated with the family', () => {
                it('physical.activities.get_id018: should return status code 403 and info message from insufficient permissions for family user who is not associated with the child', () => {

                    return request(URI)
                        .get(`/children/${defaultChild.id}/bodyfats`)
                        .set('Authorization', 'Bearer '.concat(accessTokenFamily))
                        .set('Content-Type', 'application/json')
                        .expect(403)
                        .then(err => {
                            expect(err.body).to.eql(ApiGatewayException.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                        })
                })
            })
        })

        describe('when get all body fats of a child that has been deleted', () => {
            it('bodyfats.get_all014: should return status code 200 and empty list', async () => {

                await acc.deleteUser(accessTokenAdmin, defaultChild.id)

                return request(URI)
                    .get(`/children/${defaultChild.id}/bodyfats`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .expect(400)
                    .then(err => {
                        expect(err.body.message).to.eql(`There is no registered Child with ID: ${defaultChild.id} on the platform!`)
                        expect(err.body.description).to.eql('Please register the Child and try again...')
                    })
            })
        })
    })
})