import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose'

class Haruno {
    @prop({ required: true })
    whoami!: number

    @prop({ required: true, default: false })
    newReply!: boolean

    @prop({ type: String, required: true, default: [] })
    words!: string[]
}

export type HarunoDocument = DocumentType<Haruno>
export const HarunoModel = getModelForClass(Haruno)