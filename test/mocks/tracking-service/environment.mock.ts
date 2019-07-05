import { Location} from '../../../src/tracking-service/model/location'
import { Environment } from '../../../src/tracking-service/model/environment'
import { Measurement, MeasurementType } from '../../../src/tracking-service/model/measurement'

export class EnvironmentMock extends Environment {

    constructor() {
        super()
        this.generateEnvironment()
    }

    private generateEnvironment(): void {
        super.id = this.generateObjectId()
        super.institution_id = `5c6dd16ea1a67d0034e6108b`
        super.timestamp = new Date()
        super.climatized = (Math.random() >= 0.5)
        super.measurements = this.generateMeasurements()
        super.location = new Location().fromJSON({
            local: 'Indoor',
            room: 'room 01',
            latitude: -7.2100766,
            longitude: -35.9175756
        })
    }

    private generateMeasurements(): Array<Measurement> {
        const measurements: Array<Measurement> = []
        measurements.push(this.generateTemp())
        measurements.push(this.generateHumi())

        return measurements
    }

    private generateTemp(): Measurement {
        const measurement: Measurement = new Measurement()
        measurement.type = MeasurementType.TEMPERATURE
        measurement.value = Math.random() * 13 + 19 // 19-31
        measurement.unit = '°C'

        return measurement
    }

    private generateHumi(): Measurement {
        const measurement: Measurement = new Measurement()
        measurement.type = MeasurementType.HUMIDITY
        measurement.value = Math.random() * 16 + 30 // 30-45
        measurement.unit = '%'

        return measurement
    }

    private generateObjectId(): string {
        const chars = 'abcdef0123456789'
        let randS = ''
        for (let i = 0; i < 24; i++) {
            randS += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return randS
    }
}