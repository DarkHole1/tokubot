import * as api from './mal/api'
import { ItemWithListStatus } from './mal/types/animelist'
import { Bot, Context } from 'grammy'
import { Animes } from './erai/animes'
import { readFileSync } from 'fs'
import * as statics from './static'
import { hydrateReply, ParseModeFlavor } from '@grammyjs/parse-mode'
import { loadConfig } from './config'

const config = loadConfig()

const TOKU_NAME = 'Sanso'
const ANIMES = Animes.fromFile('titles.json')
const DARK_HOLE = 369810644
const TOKU_CHAT = -1001311183194
const EGOID = 1016239817

const ANIME_RECOMMENDATIONS = [
    31646,
    47917,
    10800,
    235,
    28977,
    37999,
    9756,
    5081,
    25835,
    28735,
    24833,
    5081,
    31478,
    44511,
    10087,
    5114,
    23289,
    16918,
    820,
    34096,
    20583,
    37141,
    36296,
    11061,
    10357,
    6594,
    80,
    2076,
    28851,
    28013,
    34599,
    39196,
    37510,
    19815,
    46102,
    21,
    853,
    35247,
    30296,
    30015,
    23277,
    33255,
    44074,
    16498,
    28735,
    35839,
    11757,
    41762,
    10278,
    6213,
    41389,
    37521,
    37779,
    34798
]

const THANKS_STICKERS_FILE_IDS = [
    'CAACAgIAAxkBAAEc9aFj4-61elIbvJ5_EToY3Q0R58UNuwACuBUAAvUkGEuIvova8pk9SC4E',
    'CAACAgUAAxkBAAEc9Z1j4-6M32vtoRzGjipdR0QQ-1D6BgAC9woAArOz-VV9IEYd0GEZFi4E',
    'CAACAgQAAxkBAAEc9adj4-9ZZx7bIhqDeOsE26ZOsoamgwAC9A8AAriIAAFQ2ne7noCJnTsuBA',
    'CAACAgIAAxkBAAEc9alj4-9oAAHsbr5qCWpegfcm5R9ZNXoAAr4gAAIwg7lI0oRwtAON6TUuBA',
    'CAACAgIAAxkBAAEc9a1j4--P-PUJsJaAq-M-i6YpW6xlwgACLSgAAik3CUoLHpJhon6vSi4E',
    'CAACAgQAAxkBAAEc9bNj4-_orpZRN79vWaNA-xtsjyXKcAACrwgAAhIEmVNv_vtOxKGZci4E'
]

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

function choice<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)]
}

async function get_random_anime_recommendation() {
    await update_list_if_obsolete()
    return choice(all_animes.filter(anime => ANIME_RECOMMENDATIONS.includes(anime.node.id)))
}

const bot = new Bot<ParseModeFlavor<Context>>(config.TOKEN)
bot.use(hydrateReply)

const help = statics.help

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
    console.log(ctx.msg.from)
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

bot.hears(/(с)?пасиб(о|a)/gim, async ctx => {
    ctx.api.sendSticker(
        ctx.chat.id,
        choice(THANKS_STICKERS_FILE_IDS),
        { reply_to_message_id: ctx.message?.message_id }
    )
})

setInterval(() => {
    console.log("Fetching new animes")
    try {
        ANIMES.getSeries().then(series => {
            console.log("Series: %o", series)
            if (series.length == 0) return
            ANIMES.toFile('titles.json')
            let message = "";
            if (series.length == 1) {
                message = `Вышла ${series[0].serie} серия ${series[0].name}`
            } else {
                message = `Вышли новые серии:\n${series.map(anime => `* ${anime.serie} серия ${anime.name}`).join('\n')}`
            }
            bot.api.sendMessage(TOKU_CHAT, message)
        })
        console.log("Successfully ended")
    } catch (e) {
        console.log("Error: %o", e)
    }
}, 60 * 1000)

bot.start()