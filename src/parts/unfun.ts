import { Composer } from "grammy"
import { ANGELINA_LIST } from "../constants"
import debug from "debug"

export const unfun = new Composer()

const UNFUN_IDS = ANGELINA_LIST.filter(e => e.restricted.includes('unfun'))
const log = debug('app:parts:unfun')

unfun.on('msg', async (ctx, next) => {
    if (!ctx.message?.reply_to_message || !ctx.message.reply_to_message.from?.id) {
        return await next()
    }

    const msg = ctx.message
    const reply = ctx.message.reply_to_message
    const senderId = msg.sender_chat?.id ?? msg.from.id
    const receiverId = reply.sender_chat?.id ?? reply.from!.id

    try {
        const unid = UNFUN_IDS.find(e => e.id == senderId)
        if (senderId != receiverId && unid && unid.unfun && unid.unfun.includes(receiverId)) {
            log('Found ids %d %d', senderId, receiverId)
            await ctx.api.deleteMessage(ctx.message.chat.id, ctx.message.message_id)
            await ctx.api.restrictChatMember(ctx.message.chat.id, senderId, {
                can_send_messages: false
            }, {
                until_date: Math.floor(Date.now() / 1000) + 60 * 60
            })
        }
    } catch (e) {
        log(e)
    }
    return await next()
})