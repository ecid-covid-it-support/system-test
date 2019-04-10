import { Sleep } from '../../../src/tracking-service/model/sleep'
import { SleepPatternDataSet } from '../../../src/tracking-service/model/sleep.pattern.data.set'
import { SleepPattern, SleepPatternType } from '../../../src/tracking-service/model/sleep.pattern'

export class SleepMock extends Sleep {

    constructor() {
        super()
        super.fromJSON(JSON.stringify(this.generateSleep()))
    }

    private generateSleep(): Sleep {
        const sleep = new Sleep()
        sleep.id = this.generateObjectId()
        sleep.start_time = new Date()
        sleep.end_time = new Date(new Date(sleep.start_time)
            .setMilliseconds(Math.floor(Math.random() * 7 + 4) * 3.6e+6)) // 4-10h in milliseconds
        sleep.duration = sleep.end_time.getTime() - sleep.start_time.getTime()
        sleep.child_id = '5a62be07de34500146d9c544'
        sleep.pattern = this.generateSleepPattern(sleep.start_time, sleep.duration)

        return sleep
    }

    private generateSleepPattern(start_time: Date, duration: number): SleepPattern {
        const sleepPattern = new SleepPattern()
        const dataSet: Array<SleepPatternDataSet> = []
        const dataSetItem: SleepPatternDataSet = new SleepPatternDataSet()
        let countDuration: number = 0

        dataSetItem.start_time = new Date(start_time)
        let _start_time = new Date(start_time)
        while (countDuration < duration) {
            const item: SleepPatternDataSet = this.populateDataSetItem(_start_time)
            countDuration += item.duration
            if (countDuration > duration) {
                item.duration = item.duration - (countDuration - duration)
            }
            dataSet.push(item)
            _start_time = new Date(new Date(_start_time).setMilliseconds(item.duration))
        }

        sleepPattern.data_set = dataSet
        return sleepPattern
    }

    private populateDataSetItem(start_time: Date): SleepPatternDataSet {
        const dataSetItem: SleepPatternDataSet = new SleepPatternDataSet()
        dataSetItem.start_time = new Date(start_time)
        switch (Math.floor((Math.random() * 3))) { // 0-2
            case 1:
                dataSetItem.name = SleepPatternType.RESTLESS
                dataSetItem.duration = Math.floor(Math.random() * 5 + 1) * 60000 // 1-5min milliseconds
                return dataSetItem
            case 2:
                dataSetItem.name = SleepPatternType.AWAKE
                dataSetItem.duration = Math.floor(Math.random() * 3 + 1) * 60000 // 1-3min in milliseconds
                return dataSetItem
            default: {
                dataSetItem.name = SleepPatternType.ASLEEP
                dataSetItem.duration = Math.floor(Math.random() * 120 + 1) * 60000 // 1-180min in milliseconds
                return dataSetItem
            }
        }
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
