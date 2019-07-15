import request from 'supertest'
import { expect } from 'chai'
import { Strings } from '../utils/string.error.message'
import { Institution } from '../../src/account-service/model/institution'
import { AccountDb } from '../../src/account-service/database/account.db'
import { acc } from '../utils/account.utils'

describe('Routes: Institution', () => {

    const URI: string = 'https://localhost'

    let accessTokenAdmin: string
    let accessTokenChild: string
    let accessTokenEducator: string
    let accessTokenHealthProfessional: string
    let accessTokenFamily: string
    let accessTokenApplication: string

    const defaultInstitution: Institution = new Institution()
    defaultInstitution.type = 'Default type'
    defaultInstitution.name = 'Default name'
    defaultInstitution.address = 'Default address'
    defaultInstitution.latitude = 0
    defaultInstitution.longitude = 0

    const anotherInstitution: Institution = new Institution()
    anotherInstitution.type = "another type"
    anotherInstitution.name = "another name"

    const con = new AccountDb()

    before(async () => {
        try {
            await con.connect(0, 1000)

            const tokens = await acc.getAuths()

            accessTokenAdmin = tokens.admin.access_token
            accessTokenChild = tokens.child.access_token
            accessTokenEducator = tokens.educator.access_token
            accessTokenHealthProfessional = tokens.health_professional.access_token
            accessTokenFamily = tokens.family.access_token
            accessTokenApplication = tokens.application.access_token
            await con.deleteInstitutions()

            const resultInstitution = await acc.saveInstitution(accessTokenAdmin, defaultInstitution)
            defaultInstitution.id = resultInstitution.id

            const resultAnotherInstitution = await acc.saveInstitution(accessTokenAdmin, anotherInstitution)
            anotherInstitution.id = resultAnotherInstitution.id

        } catch (e) {
            console.log('Before Error', e.message)
        }
    })

    after(async () => {
        try {
            await con.removeCollections()
        } catch (err) {
            console.log('DB ERROR', err)
        }
    })

    describe('GET ALL /institutions', () => {

        context('when want get all institutions in database successfully', () => {

            it('institutions.get_all001: should return status code 200 and a list with two institutions', () => {

                return request(URI)
                    .get('/institutions')
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.instanceof(Array)
                        expect(res.body.length).is.eql(2)
                    })
            })

            it('institutions.get_all002: should return status code 200 and a list with two institutions in ascending order by name', () => {

                const sortField = 'name'

                return request(URI)
                    .get(`/institutions?sort=${sortField}`)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.instanceof(Array)
                        expect(res.body.length).is.eql(2)
                        expect(res.body[0].name).to.eql(anotherInstitution.name)
                        expect(res.body[1].name).to.eql(defaultInstitution.name)
                    })
            })

            it('institutions.get_all003: should return status code 200 and a list with two institutions in descending order by type', () => {

                const sortField = 'type'

                return request(URI)
                    .get(`/institutions?sort=-${sortField}`)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.instanceof(Array)
                        expect(res.body.length).is.eql(2)
                        expect(res.body[0].name).to.eql(defaultInstitution.name)
                        expect(res.body[1].name).to.eql(anotherInstitution.name)
                    })
            })

            it('institutions.get_all004: should return status code 200 and a list with only name and ID of two institutions', () => {

                const sortField = 'name'

                return request(URI)
                    .get(`/institutions?fields=${sortField}`)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.instanceof(Array)
                        expect(res.body.length).is.eql(2)
                        expect(res.body[0]).to.have.property('id')
                        expect(res.body[0]).to.have.property('name')
                        expect(res.body[0]).to.not.have.property('type')
                        expect(res.body[0]).to.not.have.property('address')
                        expect(res.body[0]).to.not.have.property('latitude')
                        expect(res.body[0]).to.not.have.property('longitude')
                    })
            })

            it('institutions.get_all005: should return status code 200 and a list of institutions with only name, ID and type of two institutions', () => {

                const sortFieldOne = 'name'
                const sortFieldTwo = 'type'

                return request(URI)
                    .get(`/institutions?fields=${sortFieldOne}%2C${sortFieldTwo}`)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.instanceof(Array)
                        expect(res.body.length).is.eql(2)
                        expect(res.body[0]).to.have.property('id')
                        expect(res.body[0]).to.have.property('name')
                        expect(res.body[0]).to.have.property('type')
                        expect(res.body[0]).to.not.have.property('address')
                        expect(res.body[0]).to.not.have.property('latitude')
                        expect(res.body[0]).to.not.have.property('longitude')
                    })
            })

            it('institutions.get_all006: should return status code 200 and a list of two most recent institutions in database', () => {

                const page = 1
                const limit = 2

                return request(URI)
                    .get(`/institutions?page=${page}&limit=${limit}`)
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.instanceof(Array)
                        expect(res.body.length).is.eql(2)
                    })
            })

        }) // get all institutions in database

        context('when the user get all institution in database', () => {

            it('institutions.get_all007: should return status code 200 and a list of institutions for admin user', () => {

                return request(URI)
                    .get('/institutions')
                    .set('Authorization', 'Bearer '.concat(accessTokenEducator))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.instanceof(Array)
                        expect(res.body.length).to.eql(2)
                    })
            })

            it('institutions.get_all008: should return status code 403 and info message from insufficient permissions for child user', () => {

                return request(URI)
                    .get('/institutions')
                    .set('Authorization', 'Bearer '.concat(accessTokenChild))
                    .set('Content-Type', 'application/json')
                    .expect(403)
                    .then(err => {
                        expect(err.body).to.eql(Strings.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                    })
            })

            it('institutions.get_all009: should return status code 200 and a list of institutions for educator user', () => {

                return request(URI)
                    .get('/institutions')
                    .set('Authorization', 'Bearer '.concat(accessTokenEducator))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.instanceof(Array)
                        expect(res.body.length).to.eql(2)
                    })
            })

            it('institutions.get_all010: should return status code 200 and a list of institutions for health professional user', () => {

                return request(URI)
                    .get('/institutions')
                    .set('Authorization', 'Bearer '.concat(accessTokenHealthProfessional))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.instanceof(Array)
                        expect(res.body.length).to.eql(2)
                    })
            })

            it('institutions.get_all011: should return status code 403 and info message from insufficient permissions for family user', () => {

                return request(URI)
                    .get('/institutions')
                    .set('Authorization', 'Bearer '.concat(accessTokenFamily))
                    .set('Content-Type', 'application/json')
                    .expect(403)
                    .then(err => {
                        expect(err.body).to.eql(Strings.ERROR_MESSAGE.ERROR_403_FORBIDDEN)
                    })
            })

            it('institutions.get_all012: should return status code 200 and a list of institutions for application user', () => {

                return request(URI)
                    .get('/institutions')
                    .set('Authorization', 'Bearer '.concat(accessTokenApplication))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.instanceof(Array)
                        expect(res.body.length).to.eql(2)
                    })
            })

        }) // user get all institution in database

        describe('when not informed the acess token', () => {
            it('institutions.get_all013: should return the status code 401 and the authentication failure informational message', () => {

                return request(URI)
                    .get('/institutions')
                    .set('Authorization', 'Bearer ')
                    .set('Content-Type', 'application/json')
                    .send(defaultInstitution)
                    .expect(401)
                    .then(err => {
                        expect(err.body).to.eql(Strings.AUTH.ERROR_401_UNAUTHORIZED)
                    })
            })
        })

        describe('when want get all institutions in database after deleting all of them', () => {
            before(async () => {
                try {
                    await con.deleteInstitutions()
                } catch (err) {
                    console.log('DB ERROR', err)
                }
            })
            it('institutions.get_all014: should return status code 200 and empty list ', () => {

                return request(URI)
                    .get('/institutions')
                    .set('Authorization', 'Bearer '.concat(accessTokenAdmin))
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(0)
                    })
            })
        })
    })
})