import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose'

class Event {
    @prop({ required: true })
    approved!: boolean

    @prop({ required: true })
    duration!: number

    @prop()
    name?: string

    @prop()
    pic?: string
}

export type EventDocument = DocumentType<Event>
export const EventModel = getModelForClass(Event)