import { Context, NextFunction } from "grammy"
import { Message } from "grammy/types"

type UserInfo = {
    id: number,
    username?: string,
    first_name: string,
    last_name?: string
}

export type UserInfoFlavour<C extends Context> = C & {
    userInfo: UserInfo
}

export function getUserInfo(msg: Message): UserInfo | null {
    let userInfo: Partial<UserInfo> = {}
    if (msg.sender_chat) {
        const sender_chat = msg.sender_chat
        userInfo.id = sender_chat.id
        if (sender_chat.type == 'private') {
            userInfo.first_name = sender_chat.first_name
            userInfo.last_name = sender_chat.last_name
        } else {
            userInfo.first_name = sender_chat.title
        }
        if (sender_chat.type != 'group') {
            userInfo.username = sender_chat.username
        }
    } else if (msg.from) {
        const from = msg.from
        userInfo.id = from.id
        userInfo.first_name = from.first_name
        userInfo.last_name = from.last_name
        userInfo.username = from.username
    }

    if (typeof userInfo.id != 'undefined' && typeof userInfo.first_name != 'undefined') {
        return userInfo as UserInfo
    }
    return null
}

export function hydrateUserInfo(init: UserInfo = { id: 0, first_name: 'Anonymous' }) {
    return async <C extends Context>(ctx: UserInfoFlavour<C>, next: NextFunction) => {
        ctx.userInfo = Object.assign({}, init)
        if (ctx.message) Object.assign(ctx.userInfo, getUserInfo(ctx.message))
        await next()
    }
}