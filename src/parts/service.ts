import { ParseModeFlavor } from '@grammyjs/parse-mode'
import { Composer, Context } from 'grammy'
import { TOKU_CHANNEL } from '../constants'
import * as statics from '../static'
import { throttle } from '../utils'

export const service = new Composer<ParseModeFlavor<Context>>

service.on('message:new_chat_members', async ctx => {
    await ctx.replyFmt(statics.greeting)
})

service.on('message:is_automatic_forward').filter(ctx => ctx.senderChat?.id == TOKU_CHANNEL, throttle(3 * 60 * 1000, (ctx: ParseModeFlavor<Context>) => {
    ctx.replyFmt(statics.post, {
        reply_to_message_id: ctx.message?.message_id
    })
}))