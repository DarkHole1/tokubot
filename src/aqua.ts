import { Bot, Context } from "grammy";
import { Config } from "./config";

const config = new Config()

const bot = new Bot(config.TOKEN)

const message = "Привет, это Аква! Руби ненадолго прилегла, а если надолго, то пишите @darkhole1"

bot.command(['start', 'hastokuwatched', 'recommend', 'observed', 'addsticker'], ctx => ctx.reply(message, {
    reply_to_message_id: ctx.msg.message_id
}))

// bot.command('inspect', )

bot.start()
