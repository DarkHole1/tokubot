import * as api from '../mal/api'
import { Recommendations } from '../data'
import { ItemWithListStatus } from '../mal/types/animelist'
import { EGOID, TOKU_NAME } from '../constants'
import { Composer, Context } from 'grammy'
import { ParseModeFlavor, fmt, link } from '@grammyjs/parse-mode'

const animeRecommendations = Recommendations.fromFileSyncSafe('data/recommendations.json')
const animeRecommendationsExtended = Recommendations.fromFileSyncSafe('data/extended.json')

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

export const recommendations = new Composer<ParseModeFlavor<Context>>

recommendations.command('hastokuwatched', async (ctx) => {
    const anime = ctx.match
    if (anime == '') {
        await ctx.reply('Ты кажется забыл указать аниме после команды', {
            reply_to_message_id: ctx.msg.message_id
        })
        return
    }

    ctx.api.sendChatAction(ctx.chat.id, 'typing')
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

recommendations.command('recommend', async ctx => {
    await ctx.api.sendChatAction(ctx.chat.id, "typing")
    let whoami: string
    let anime: { node: { title: string, id: number } }
    if (ctx.msg.from?.id == EGOID) {
        whoami = 'Эгоизм'
        anime = {
            node: {
                title: 'Yahari Ore no Seishun Love Comedy wa Machigatteiru.',
                id: 14813
            }
        }
    } else {
        whoami = 'Току'
        anime = await get_random_anime_recommendation()
    }
    await ctx.replyFmt(fmt`Согласно статистике, ${whoami} рекомендует посмотреть ${link(anime.node.title, `https://myanimelist.net/anime/${anime.node.id}`)}`, {
        reply_to_message_id: ctx.message?.message_id
    })
})

recommendations.command('recommend_extended', async ctx => {
    ctx.api.sendChatAction(ctx.chat.id, "typing")
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
    await ctx.replyFmt(fmt`Согласно статистике, ${whoami} рекомендует посмотреть ${link(anime.node.title, `https://myanimelist.net/anime/${anime.node.id}`)}`, {
        reply_to_message_id: ctx.message?.message_id
    })
})