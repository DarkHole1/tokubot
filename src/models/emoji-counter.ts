import { DocumentType, getModelForClass, prop } from "@typegoose/typegoose"

export class UserCounter {
    @prop({ required: true })
    name!: string

    @prop({ required: true, default: () => new Map, type: () => Number })
    counters!: Map<string, number>
}

class EmojiCounters {
    @prop({ required: true, default: () => new Map, type: () => Number })
    overall!: Map<string, number>

    @prop({ required: true, default: () => new Map, type: () => UserCounter })
    byUser!: Map<string, UserCounter>
}

export type EmojiCountersDocument = DocumentType<EmojiCounters>
export const EmojiCountersModel = getModelForClass(EmojiCounters)