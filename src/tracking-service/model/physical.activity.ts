import { PhysicalActivityLevel } from './physical.activity.level'
import { Activity } from './activity'
import { PhysicalActivityHeartRate } from './physical.activity.heart.rate'

/**
 * Implementation of the physical physicalactivity entity.
 *
 * @extends {Entity}
 */
export class PhysicalActivity extends Activity {
    public name?: string // Name of physical physicalactivity.
    public calories?: number // Calories spent during physical physicalactivity.
    public steps?: number // Number of steps taken during the physical physicalactivity.
    public distance?: number // Distance traveled during the physical activity.
    public levels?: Array<PhysicalActivityLevel> // PhysicalActivity levels (sedentary, light, fair or very).
    public heart_rate?: PhysicalActivityHeartRate // PhysicalActivity heart rate

    public fromJSON(json: any): PhysicalActivity {
        if (!json) return this
        super.fromJSON(json)

        if (typeof json === 'string') {
            json = JSON.parse(json)
        }

        if (json.name !== undefined) this.name = json.name
        if (json.calories !== undefined) this.calories = json.calories
        if (json.steps !== undefined) this.steps = json.steps
        if (json.distance !== undefined) this.distance = json.distance
        if (json.levels !== undefined && json.levels instanceof Array) {
            this.levels = json.levels.map(level => new PhysicalActivityLevel().fromJSON(level))
        }
        if (json.heart_rate) this.heart_rate = new PhysicalActivityHeartRate().fromJSON(json.heart_rate)

        return this
    }

    public toJSON(): any {
        return {
            ...super.toJSON(),
            ...{
                name: this.name,
                calories: this.calories,
                steps: this.steps,
                distance: this.distance,
                levels: this.levels ? this.levels.map(item => item.toJSON()) : this.levels,
                heart_rate: this.heart_rate ? this.heart_rate.toJSON() : this.heart_rate
            }
        }
    }
}
