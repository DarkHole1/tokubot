import { ParseModeFlavor } from '@grammyjs/parse-mode'
import { Composer, Context } from 'grammy'
import { LINKS_PHOTO, OLD_TOKU_CHAT, TOKU_CHANNEL } from '../constants'
import * as statics from '../static'
import { throttle } from '../utils'

export const service = new Composer<ParseModeFlavor<Context>>

service.on('message:new_chat_members', async ctx => {
    if (ctx.chat.id == OLD_TOKU_CHAT) {
        await ctx.replyFmt(statics.greetingOld)
        return
    }
    await ctx.replyFmt(statics.greeting, {
        reply_markup: {
            inline_keyboard: [[{
                text: `Правила`, 
                url: `https://t.me/c/2000257215/800280`
            }, {
                text: `К просмотру`,
                url: `https://t.me/c/2000257215/410`
            }],
            [{
                text: `Каналы участников`,
                url: `https://t.me/addlist/GRDMBpfvBW5mYTRi`
            }]]
        }
    })
})

service.on('message:is_automatic_forward').filter(ctx => ctx.senderChat?.id == TOKU_CHANNEL, throttle(3 * 60 * 1000, (ctx: ParseModeFlavor<Context>) => 
    ctx.replyWithPhoto(LINKS_PHOTO, {
        reply_to_message_id: ctx.message?.message_id,
        caption: statics.post,
        reply_markup: {
            inline_keyboard: [[{
                text: 'YouTube',
                url: 'https://www.youtube.com/c/TokuTonari'
            }, {
                text: 'MAL',
                url: 'https://myanimelist.net/profile/Sanso'
            }, {
                text: 'Shiki',
                url: 'https://shikimori.one/Toku+Tonari'
            }], [{
                text: 'Чат',
                url: 'https://t.me/+OmoqFQZUVs03MjVi'
            }, {
                text: 'Boosty',
                url: 'https://boosty.to/tokutonari'
            }], [{
                text: 'Mini Wiki',
                url: 'https://pushy-galaxy-071.notion.site/Toku-Tonari-Mini-Wiki-1a56a63628a1409db87106378126aac3'
            }]]
        }
    })
))

service.on('message').filter(
    ctx => ctx.chat.id == OLD_TOKU_CHAT && !ctx.message.is_automatic_forward && !ctx.message.message_thread_id,
    ctx => ctx.replyFmt(statics.missMessage, {
        reply_parameters: {
            message_id: ctx.msg.message_id
        }
    })
)