import { DocumentType, getModelForClass, prop } from "@typegoose/typegoose"

class StatsEntry {
    @prop({ required: true })
    watchedMinutes!: number
    @prop({ required: true })
    plannedMinutes!: number

    @prop({ required: true })
    telegramID!: number
}

class Stats {
    @prop({ required: true })
    initial!: StatsEntry

    @prop({ required: true })
    currentWatchedMinutes!: number
    @prop({ required: true })
    currentPlannedMinutes!: number

    @prop({ required: true })
    telegramID!: number
}

export const StatsModel = getModelForClass(Stats)
export type StatsDocument = DocumentType<Stats>

export const StatsEntryModel = getModelForClass(StatsEntry)
export type StatsEntryDocument = DocumentType<StatsEntry>
