import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose'

class EverydayPost {
    @prop({ required: true })
    type!: string

    @prop({ required: true })
    fileId!: string
}

export type EverydayPostDocument = DocumentType<EverydayPost>
export const EverydayPostModel = getModelForClass(EverydayPost)