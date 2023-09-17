import * as api from './mal/api'
import { ItemWithListStatus } from './mal/types/animelist'
import { Bot, Context, GrammyError, InlineKeyboard } from 'grammy'
import { Animes } from './erai/animes'
import * as statics from './static'
import { fmt, FormattedString, hydrateReply, ParseModeFlavor, link } from '@grammyjs/parse-mode'
import { Config } from './config'
import { isAdmin, randomString, throttle } from "./utils"
import { Recommendations, ThanksStickers } from './data'
import { Anime } from './erai/anime'
import { TOKU_NAME, EGOID, BOT_ID, TOKU_CHAT, TOKU_CHANNEL, ANGELINA_LIST, DARK_HOLE } from './constants'
import { fun } from './parts/fun'
import { brs } from './parts/brs'
import { voting } from './parts/voting'
import { backArrow } from './parts/backarrow'
import { solidScript } from './parts/solid-scritpt'
import { service } from './parts/service'

const config = new Config()
const animes = Animes.fromFileSafe('data/titles.json', config.ERAI_TOKEN)
const animeRecommendations = Recommendations.fromFileSyncSafe('data/recommendations.json')
const animeRecommendationsExtended = Recommendations.fromFileSyncSafe('data/extended.json')
const thanksStickers = ThanksStickers.fromFileSyncSafe('data/thanks.json')

function escape_string(s: string) {
    return s.replace(/[\_\*\[\]\(\)\~\`\>\#\+\-\=\|\{\}\.\!]/g, '\\$&')
}

async function get_all_anime(user: string) {
    const limit = 1000
    let anime: ItemWithListStatus[] = []
    while (true) {
        const res = await api.get_user_anime_list_with_list_status(user, {
            limit,
            offset: anime.length
        })
        if ('error' in res) break
        anime = anime.concat(res.data)
        if (!('next' in res.paging)) break
    }
    return anime
}

let all_animes: ItemWithListStatus[] = []
let completed_animes: Set<string> = new Set()
let last = new Date(0)

async function update_list_if_obsolete() {
    const now = new Date()
    if (now.getTime() - last.getTime() >= 60 * 60 * 1000) {
        all_animes = await get_all_anime(TOKU_NAME)
        completed_animes = new Set(
            all_animes
                .filter(anime => anime.list_status.status == 'completed')
                .map(anime => anime.node.title.toLowerCase())
        )
        last = now
    }
}

async function check_in_list(anime: string) {
    await update_list_if_obsolete()
    return completed_animes.has(anime.toLowerCase())
}

async function get_random_anime_recommendation() {
    await update_list_if_obsolete()
    return animeRecommendations.getRandomRecommendation(all_animes)
}

async function get_random_anime_recommendation_extended() {
    await update_list_if_obsolete()
    return animeRecommendationsExtended.getRandomRecommendation(all_animes)
}

const bot = new Bot<ParseModeFlavor<Context>>(config.TOKEN)
bot.use(hydrateReply)

const help = statics.help

bot.catch(async err => {
    console.error(err.error)
    try {
        const e = err.error
        if(e instanceof GrammyError) {
            await bot.api.sendMessage(DARK_HOLE, `An error occured in bot ${err.ctx.me.username}: ${e.description}`)
        }
    } catch(e) {
        console.log(`Send failed`)
    }
})

bot.command('start', (ctx) =>
    ctx.replyFmt(help, {
        reply_to_message_id: ctx.msg.message_id
    })
)

bot.command('hastokuwatched', async (ctx) => {
    const anime = ctx.match
    if (anime == '') {
        await ctx.reply('Ты кажется забыл указать аниме после команды', {
            reply_to_message_id: ctx.msg.message_id
        })
        return
    }

    bot.api.sendChatAction(ctx.chat.id, 'typing')
    if (await check_in_list(anime)) {
        await ctx.reply(`Ага, Току посмотрел ${anime}`, {
            reply_to_message_id: ctx.msg.message_id
        })
    } else {
        await ctx.reply(`Нет, Току не посмотрел ${anime} (или вы ошиблись с названием)`, {
            reply_to_message_id: ctx.msg.message_id
        })
    }
})

bot.command('recommend', async ctx => {
    bot.api.sendChatAction(ctx.chat.id, "typing")
    if (ctx.msg.from?.id == EGOID) {
        const anime = {
            node: {
                title: 'Yahari Ore no Seishun Love Comedy wa Machigatteiru.',
                id: 14813
            }
        }
        ctx.reply(`Согласно статистике, Эгоизм рекомендует посмотреть [${escape_string(anime.node.title)}](https://myanimelist.net/anime/${anime.node.id})`, {
            parse_mode: 'MarkdownV2',
            reply_to_message_id: ctx.message?.message_id
        })
        return
    }
    const anime = await get_random_anime_recommendation()
    ctx.reply(`Согласно статистике, Току рекомендует посмотреть [${escape_string(anime.node.title)}](https://myanimelist.net/anime/${anime.node.id})`, {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: ctx.message?.message_id
    })
})

bot.command('recommendExtended', async ctx => {
    console.log(animeRecommendationsExtended)
    bot.api.sendChatAction(ctx.chat.id, "typing")
    let anime: { node: { title: string, id: number }}
    let whoami: string
    if (ctx.msg.from?.id == EGOID) {
        whoami = 'Эгоизм'
        anime = {
            node: {
                title: 'Bakemonogatari',
                id: 5081
            }
        }
    } else {
        whoami = 'Току'
        anime = await get_random_anime_recommendation_extended()
    }
    ctx.replyFmt(fmt`Согласно статистике, ${whoami} рекомендует посмотреть ${link(anime.node.title, `https://myanimelist.net/anime/${anime.node.id}`)}`, {
        reply_to_message_id: ctx.message?.message_id
    })
})

bot.use(service)
bot.use(voting)
bot.use(backArrow(config))
bot.use(solidScript)

brs(bot)


bot.hears(/(с)?пасиб(о|a)/gim).filter(async ctx => ctx.message?.reply_to_message?.from?.id == BOT_ID ?? false, async ctx => {
    ctx.api.sendSticker(
        ctx.chat.id,
        thanksStickers.getRandomSticker().fileId,
        { reply_to_message_id: ctx.message?.message_id }
    )
})

bot.filter(ctx => !ANGELINA_LIST.includes(ctx.from?.id ?? 0)).use(fun)

bot.command('addsticker').filter(
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

bot.command('add').filter(
    isAdmin,
    async ctx => {
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

bot.hears(/https:\/\/www\.erai-raws\.info\/anime-list\/\S+\/feed\/\?[a-z0-9]{32}/).filter(
    isAdmin,
    async ctx => {
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

        callbacksForKeyboard.set(uid, async _ctx => {
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

bot.on('callback_query:data', async ctx => {
    const data = ctx.callbackQuery.data
    const handler = callbacksForKeyboard.get(data)
    if (!handler) {
        await ctx.answerCallbackQuery()
        return
    }
    await handler(ctx)
})

bot.command('observed', ctx => ctx.reply(`Всё что я наблюдаю:\n${animes.list().map(anime => `* ${anime.name} (серий: ${anime.series})`).join('\n')}`, {
    reply_to_message_id: ctx.message?.message_id
}))

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

bot.start()
