import { DocumentType, getModelForClass, prop } from "@typegoose/typegoose"

class EmojiCounters {
    @prop({ required: true, default: () => new Map })
    overall!: Map<string, number>

    @prop({ required: true, default: () => new Map })
    byUser!: Map<string, Map<string, number>>
}

export type EmojiCountersDocument = DocumentType<EmojiCounters>
export const EmojiCountersModel = getModelForClass(EmojiCounters)