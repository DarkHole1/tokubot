import { Composer } from 'grammy'
import { BOT_ID } from '../constants'
import { ThanksStickers } from '../data'
import { isAdmin } from '../utils'

export const thanks = new Composer
const thanksStickers = ThanksStickers.fromFileSyncSafe('data/thanks.json')

thanks.hears(/(с)?пасиб(о|a)/gim).filter(async (ctx) => ctx.message?.reply_to_message?.from?.id == ctx.me.id ?? false, async (ctx) => {
    ctx.api.sendSticker(
        ctx.chat.id,
        thanksStickers.getRandomSticker().fileId,
        { reply_to_message_id: ctx.message?.message_id }
    )
})

thanks.command('addsticker').filter(
    isAdmin,
    async ctx => {
        const sticker = ctx.msg.reply_to_message?.sticker
        if (!sticker) {
            await ctx.reply("Надо отвечать на сообщение со стикером", {
                reply_to_message_id: ctx.message?.message_id
            })
            return
        }
        const success = thanksStickers.add(sticker)
        const reply = success ? 'Стикер добавлен супер успешно!' : 'Что-то пошло не так. Скорее всего стикер уже супер добавлен.'
        if (success) {
            await thanksStickers.toFile('data/thanks.json')
        }
        await ctx.reply(reply, {
            reply_to_message_id: ctx.message?.message_id
        })
    }
)
