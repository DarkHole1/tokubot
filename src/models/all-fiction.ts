import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose'

class AllFiction {
    @prop({ default: 0 })
    lastStartMessage!: number
}

export type AllFictionDocument = DocumentType<AllFiction>
export const AllFictionModel = getModelForClass(AllFiction)