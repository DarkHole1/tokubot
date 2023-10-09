import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose'

class Counters {
    @prop({ default: 0 })
    worldTriggerDays!: number
}

export type CountersDocument = DocumentType<Counters>
export const CountersModel = getModelForClass(Counters)