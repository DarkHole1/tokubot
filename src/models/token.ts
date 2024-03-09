import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose'

class UserInfo {
    @prop({ required: true })
    id!: number
    
    @prop({ required: true })
    username!: string

    @prop({ required: true })
    allowPost!: boolean
}

class Token {
    @prop({ required: true })
    token!: string

    @prop({ required: true })
    user!: UserInfo
}

export const TokenModel = getModelForClass(Token)
export type TokenDocument = DocumentType<Token>