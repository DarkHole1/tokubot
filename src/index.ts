import * as api from './mal/api'
import { ItemWithListStatus } from './mal/types/animelist'
import { Bot, Context } from 'grammy'
import { Animes } from './erai/animes'
import * as statics from './static'
import { hydrateReply, ParseModeFlavor } from '@grammyjs/parse-mode'
import { Config } from './config'
import { choice, throttle } from "./utils"
import { Recommendations, ThanksStickers } from './data'

const config = new Config()

const TOKU_NAME = 'Sanso'
const ANIMES = Animes.fromFile('data/titles.json')
const DARK_HOLE = 369810644
const TOKU_CHAT = -1001311183194
const TOKU_CHANNEL = -1001446681491
const EGOID = 1016239817
const BOT_ID = 5627801063

const ANIME_RECOMMENDATIONS = Recommendations.fromFileSync('data/recommendations.json')

const THANKS_STICKERS = ThanksStickers.fromFileSync('data/thanks.json')

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
    return ANIME_RECOMMENDATIONS.getRandomRecommendation(all_animes)
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

bot.hears(/(с)?пасиб(о|a)/gim).filter(async ctx => ctx.message?.reply_to_message?.from?.id == BOT_ID ?? false, async ctx => {
    ctx.api.sendSticker(
        ctx.chat.id,
        THANKS_STICKERS.getRandomSticker().fileId,
        { reply_to_message_id: ctx.message?.message_id }
    )
})

bot.on('message:is_automatic_forward').filter(ctx => ctx.senderChat?.id == TOKU_CHANNEL, throttle(3 * 60 * 1000, (ctx: Context) => {
    ctx.reply("@tokutonariwa пости на юбуб", {
        reply_to_message_id: ctx.message?.message_id
    })
}))

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