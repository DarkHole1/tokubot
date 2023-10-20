import { Bot, Composer, Context, InlineKeyboard } from "grammy"
import { isAdmin, randomString } from "../utils"
import { Anime } from "../erai/anime"
import { Animes } from '../erai/animes'
import { FormattedString, ParseModeFlavor, fmt } from '@grammyjs/parse-mode'
import * as statics from '../static'
import { Config } from '../config'
import { TOKU_CHAT } from '../constants'


export function sadAnimeWatcher(config: Config, bot: Bot<ParseModeFlavor<Context>>) {
    const animes = Animes.fromFileSafe('data/titles.json', config.ERAI_TOKEN)

    const sadAnimeWatcher = new Composer

    sadAnimeWatcher.command('add').filter(
        isAdmin,
        async (ctx) => {
            if (ctx.match.length == 0) return
            const anime = Anime.fromName(ctx.match)
            animes.add(anime)
            await animes.toFileAsync('data/titles.json')
            await ctx.reply('Супер-успешно добавили аниме в список', {
                reply_to_message_id: ctx.msg.message_id
            })
        }
    )
    // Sorry I don't know how make this better :D 
    const callbacksForKeyboard = new Map<string, (c: Context) => Promise<unknown>>()
    sadAnimeWatcher.hears(/https:\/\/www\.erai-raws\.info\/anime-list\/\S+\/feed\/\?[a-z0-9]{32}/).filter(
        isAdmin,
        async (ctx) => {
            const url: string = typeof ctx.match == 'string' ? ctx.match : ctx.match[0]
            const anime = await Anime.fromURL(url)

            if (!anime) {
                await ctx.reply(`Не получилось найти аниме`, {
                    reply_to_message_id: ctx.message?.message_id,
                })
                return
            }

            const uid = randomString()
            const inlineKeyboard = new InlineKeyboard()
                .text("Да", uid)


            const message = await ctx.reply(`Хотите добавить аниме ${anime.name} (сейчас там ${anime.series} серий)?`, {
                reply_to_message_id: ctx.message?.message_id,
                reply_markup: inlineKeyboard
            })

            callbacksForKeyboard.set(uid, async (_ctx) => {
                if (!isAdmin(_ctx)) {
                    await _ctx.answerCallbackQuery({
                        text: "Ты не ад(м)ин"
                    })
                    return
                }
                animes.add(anime)
                await animes.toFileAsync('data/titles.json')
                await _ctx.answerCallbackQuery({
                    text: "Успешно добавлено"
                })
                await ctx.api.editMessageText(message.chat.id, message.message_id, `Успешно добавлено ${anime.name}`)
            })
        }
    )
    sadAnimeWatcher.on('callback_query:data', async (ctx) => {
        const data = ctx.callbackQuery.data
        const handler = callbacksForKeyboard.get(data)
        if (!handler) {
            await ctx.answerCallbackQuery()
            return
        }
        await handler(ctx)
    })
    sadAnimeWatcher.command('observed', ctx => ctx.reply(`Всё что я наблюдаю:\n${animes.list().map((anime, i) => `${i + 1}. ${anime.name} (серий: ${anime.series})`).join('\n')}`, {
        reply_to_message_id: ctx.message?.message_id
    }))
    sadAnimeWatcher.command('rename').filter(
        isAdmin,
        async (ctx) => {
            const match = ctx.match.match(/(\d+) (.+)/)
            if (!match) {
                return await ctx.reply('Хмф', { reply_to_message_id: ctx.msg.message_id })
            }
            const id = parseInt(match[1])
            const newName = match[2]
            animes.rename(id - 1, newName)
            await animes.toFileAsync('data/titles.json')
            return await ctx.reply('Переимяуновали')
        }
    )
    sadAnimeWatcher.command('delete').filter(
        isAdmin,
        async (ctx) => {
            const match = ctx.match.match(/(\d+)/)
            if (!match) {
                return await ctx.reply('Хмф', { reply_to_message_id: ctx.msg.message_id })
            }
            const id = parseInt(match[1])
            animes.delete(id - 1)
            await animes.toFileAsync('data/titles.json')
            return await ctx.reply('[ДАННЫЕ УДАЛЕНЫ]')
        }
    )

    animes.start(async (updates) => {
        await animes.toFileAsync('data/titles.json')
        let message: FormattedString
        if (updates.length == 1) {
            message = fmt`Вышла ${statics.formatUpdate(updates[0], false)}`
        } else {
            message = fmt`Вышли новые серии:\n${updates.map(update => fmt`* ${statics.formatUpdate(update, true)}`).reduce((a, b) => fmt`${a}\n${b}`)}`
        }
        console.log(message)
        bot.api.sendMessage(TOKU_CHAT, message.toString(), { entities: message.entities })
        console.log("Successfully ended")
    })

    return sadAnimeWatcher
}
