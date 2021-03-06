import { Child } from '../../../src/account-service/model/child'
import { Institution } from '../../../src/account-service/model/institution'

export class ChildMock extends Child {

    constructor() {
        super()
        this.generateChild()
    }

    private generateChild(): void {
        super.id = this.generateObjectId()
        super.username = 'BR '.concat(this.generateObjectId())
        super.password = 'child123'
        super.institution = this.generateInstitution()
        super.age = `${Math.floor(Math.random() * 5) + 5}`
        super.gender = this.generateGender()
        super.last_login = new Date()
        super.last_sync = new Date()
        super.age_calc_date = '2019-12-10'
    }

    private generateObjectId(): string {
        const chars = 'abcdef0123456789'
        let randS = ''
        for (let i = 0; i < 24; i++) {
            randS += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return randS
    }

    private generateInstitution(): Institution {
        const institution = new Institution()
        institution.id = this.generateObjectId()
        institution.type = 'Institute of Scientific Research'
        institution.name = 'Name Example'
        institution.address = '221B Baker Street, St.'
        institution.latitude = Math.random() * 90
        institution.longitude = Math.random() * 180
        return institution
    }

    private generateGender(): string | undefined {
        switch (Math.floor((Math.random() * 2))) { // 0-1
            case 0:
                return GenderMock.MALE
            case 1:
                return GenderMock.FEMALE
        }
    }
}

export enum GenderMock {
    MALE = 'male',
    FEMALE = 'female'
}
