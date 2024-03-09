import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose'

class Token {
    @prop({ required: true })
    token!: string

    @prop({ required: true })
    user!: UserInfo
}

class UserInfo {
    @prop({ required: true })
    id!: number
    
    @prop({ required: true })
    username!: string

    @prop({ required: true })
    allowPost!: boolean
}

export const TokenModel = getModelForClass(Token)
export type TokenDocument = DocumentType<Token>