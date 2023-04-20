import { Bot, Context } from "grammy";
import { Config } from "./config";
import { fmt, hydrateReply, ParseModeFlavor, pre } from '@grammyjs/parse-mode'

const DARK_HOLE = 369810644
const config = new Config()
const message = "Привет, это Аква! Руби ненадолго прилегла, а если надолго, то пишите @darkhole1"

const bot = new Bot<ParseModeFlavor<Context>>(config.TOKEN)
bot.use(hydrateReply)

bot.command(['start', 'hastokuwatched', 'recommend', 'observed', 'addsticker'], ctx => ctx.reply(message, {
    reply_to_message_id: ctx.msg.message_id
}))

bot.command('inspect').filter(
    ctx => ctx.from?.id == DARK_HOLE,
    ctx => ctx.replyFmt(fmt`${pre(JSON.stringify(ctx.msg.reply_to_message, null, 2), 'json')}`, {
        reply_to_message_id: ctx.msg.message_id
    })
)

bot.start()
