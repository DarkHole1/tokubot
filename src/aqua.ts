import { Bot, Context, InlineKeyboard } from "grammy";
import { Config } from "./config";
import { fmt, hydrateReply, ParseModeFlavor, pre } from '@grammyjs/parse-mode'
import { ThanksStickers } from "./data";
import { createExportAssignment } from "typescript";

const DARK_HOLE = 369810644
const config = new Config()
const message = "Привет, это Аква! Руби ненадолго прилегла, а если надолго, то пишите @darkhole1"

const bot = new Bot<ParseModeFlavor<Context>>(config.TOKEN)
bot.use(hydrateReply)

bot.command(['start', 'hastokuwatched', 'recommend', 'observed', 'addsticker'], ctx => ctx.reply(message, {
    reply_to_message_id: ctx.msg.message_id
}))

const admin = bot.filter(ctx => ctx.from?.id == DARK_HOLE)

admin.command(
    'inspect',
    ctx => ctx.replyFmt(fmt`${pre(JSON.stringify(ctx.msg.reply_to_message, null, 2), 'json')}`, {
        reply_to_message_id: ctx.msg.message_id
    })
)

admin.command(
    'paginated',
    async ctx => {
        const file_id = ctx.msg.reply_to_message?.sticker?.file_id
        if (!file_id) {
            return
        }
        const keyboard = new InlineKeyboard().text('1').text('2')
        await ctx.replyWithSticker(file_id, {
            reply_to_message_id: ctx.msg.message_id,
            reply_markup: keyboard
        })
    }
)

admin.command(
    'sticker',
    async ctx => {
        try {
            const stickers = await ThanksStickers.fromFile('data/thanks.json')
            const keyboard = new InlineKeyboard()
            const id = +ctx.match
            const sticker = stickers.get(id)
            ctx.replyWithSticker(sticker.fileId, { reply_to_message_id: ctx.msg.message_id })
        } catch(e) {
            console.log(e)
            ctx.reply('Произошла какая-то ошибка. Так мне сказал мой побочный эффект.')
        }
    }
)

bot.start()
