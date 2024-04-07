import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose'

class Profile {
    @prop({ required: true })
    telegramID!: number

    @prop()
    shikimoriUsername?: string

    @prop()
    anilistUsername?: string

    @prop()
    myanimelistUsernme?: string

    @prop({ default: 'shikimori', required: true, enum: ['shikimori', 'anilist', 'mal'] })
    mainAccount!: 'shikimori' | 'anilist' | 'mal'
}

export const ProfileModel = getModelForClass(Profile)
export type ProfileDocument = DocumentType<Profile>