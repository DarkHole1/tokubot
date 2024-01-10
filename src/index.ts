import * as api from './mal/api'
import { ItemWithListStatus } from './mal/types/animelist'
import { Bot, Context, GrammyError } from 'grammy'
import * as statics from './static'
import { fmt, hydrateReply, ParseModeFlavor, link } from '@grammyjs/parse-mode'
import { Config } from './config'
import { Recommendations } from './data'
import { TOKU_NAME, EGOID, TOKU_CHAT, ANGELINA_LIST, DARK_HOLE } from './constants'
import { fun } from './parts/fun'
import { brs } from './parts/brs'
import { backArrow } from './parts/backarrow'
import { solidScript } from './parts/solid-scritpt'
import { service } from './parts/service'
import { worldTrigger } from './parts/world-trigger'
import { autoMultiLink } from './parts/auto-multi-link'
import { watchGroups } from './vk/watcher'
import mongoose from 'mongoose'
import { thanks } from './parts/thanks'
import { sadAnimeWatcher } from './parts/sad-anime-watcher'
import { voting2 } from './parts/voting2'
import { isAdmin } from 'grammy-guard'
import { blessing } from './parts/blessing'
import { unspoil } from './parts/unspoil'

const config = new Config()
const animeRecommendations = Recommendations.fromFileSyncSafe('data/recommendations.json')
const animeRecommendationsExtended = Recommendations.fromFileSyncSafe('data/extended.json')

mongoose.connect(config.MONGODB_URI)

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
        if (e instanceof GrammyError) {
            await bot.api.sendMessage(DARK_HOLE, `An error occured:\n${e.description}`)
        }
    } catch (e) {
        console.log(`Send failed`)
    }
})

bot.command('stop').filter(isAdmin, _ => bot.stop())

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
    let anime: { node: { title: string, id: number } }
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
bot.use(voting2)
bot.use(backArrow(config))
bot.use(solidScript)
bot.use(autoMultiLink)

brs(bot)
worldTrigger(bot)


bot.filter(ctx => !ANGELINA_LIST.includes(ctx.from?.id ?? 0)).use(fun)
bot.use(unspoil)
bot.use(blessing)
bot.use(thanks)
bot.use(sadAnimeWatcher(config, bot))

watchGroups(config.VK_SERVICE_KEY, [-199157142], async (posts) => {
    for (const post of posts) {
        await bot.api.sendMessage(TOKU_CHAT, `https://vk.com/wall${post.owner_id}_${post.id}`)
    }
})

bot.start()
