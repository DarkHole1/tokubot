import { Context, NextFunction } from "grammy"

type UserInfo = {
    id: number,
    username?: string,
    first_name: string,
    last_name?: string
}

export type UserInfoFlavour<C extends Context> = C & {
    userInfo: UserInfo
}

export function hydrateUserInfo(init: UserInfo = { id: 0, first_name: 'Anonymous' }) {
    return async <C extends Context>(ctx: UserInfoFlavour<C>, next: NextFunction) => {
        let userInfo = Object.assign({}, init)
        ctx.userInfo = userInfo
        if (ctx.senderChat) {
            const senderChat = ctx.senderChat
            userInfo.id = senderChat.id
            if (senderChat.type == 'private') {
                userInfo.first_name = senderChat.first_name
                userInfo.last_name = senderChat.last_name
            } else {
                userInfo.first_name = senderChat.title
            }
            if (senderChat.type != 'group') {
                userInfo.username = senderChat.username
            }
        } else if (ctx.from) {
            const from = ctx.from
            userInfo.id = from.id
            userInfo.first_name = from.first_name
            userInfo.last_name = from.last_name
            userInfo.username = from.username
        }
        await next()
    }
}