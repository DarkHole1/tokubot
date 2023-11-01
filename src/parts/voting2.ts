import { pre } from '@grammyjs/parse-mode'
import { Composer, Context, InlineKeyboard, InputFile } from "grammy"
import { Animes, Answers, Votes2 } from "../models/votes2"
import * as statics from '../static'
import { API } from 'shikimori'
import debug from 'debug'

export const voting2 = new Composer
const log = debug("tokubot:voting")
const shikimori = new API({
    baseURL: 'https://shikimori.one/api',
    axios: {
        headers: {
            'Accept-Encoding': '*'
        }
    }
})
const until = new Date('1 December 2023')
const VOTES_FILE = 'data/votes4.json'
const votes = Votes2.loadSync(VOTES_FILE)

voting2.command('startvoting', async ctx => {
    if (new Date() > until) {
        await ctx.reply('Прости, время закончилось :(')
        return
    }

    if (ctx.match.length == 0) {
        const inlineKeyboard = new InlineKeyboard().text('Понятненька', 'voting:start')
        try {
            await ctx.reply(statics.startVoting, {
                reply_markup: inlineKeyboard
            })
        } catch (e) { }
        return
    } else {
        try {
            log("Trying to get scores of %s", ctx.match)
            const scores = await shikimori.users.animeRates({
                id: ctx.match,
                limit: 5000
            })
            log("Got %d scores", scores.length)
            for (const score of scores) {
                switch (score.status) {
                    case 'planned':
                        votes.addVoteByMalId(score.anime.id, ctx.from!.id, 'planning')
                        break
                    case 'dropped':
                        votes.addVoteByMalId(score.anime.id, ctx.from!.id, 'dropped')
                        break
                    case 'on_hold':
                    case 'rewatching':
                    case 'watching':
                        votes.addVoteByMalId(score.anime.id, ctx.from!.id, 'not_finished')
                        break
                    case 'completed':
                        // Lol
                        if (score.score == 0) break
                        votes.addVoteByMalId(score.anime.id, ctx.from!.id, score.score.toFixed(0) as ('1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'))
                        break
                }
            }
            await votes.save(VOTES_FILE)
            await ctx.reply('Успешно добавили аниме в списочек')
        } catch (e) {
            console.log(e)
            await ctx.reply('Похоже что-то пошло не так. Проверьте ник, попробуйте позже, напишите @darkhole1...')
        }
    }
})

voting2.command('rating', async ctx => {
    const unique = votes.unique()
    const animes = votes.count()
    const clamp = (e: number, a: number, b: number) => Math.min(Math.max(e, a), b)

    const totalBlock = `Всего тайтлов: ${animes.length}. Всего проголосовало: ${unique}.`

    const notInterecting = animes.filter(anime => !Object.entries(anime.votes).some(([k, v]) => k != 'not_planning' && v != 0))
    const notInterectingFormatted = notInterecting.map(anime => `* ${anime.name} / ${anime.russian}`).join('\n')
    const notInterectingBlock = `Абсолютно неинтересные тайтлы:\n${notInterectingFormatted}`

    const ratedAnimes = animes.map(anime => {
        const { sum, unique } = Object.entries(anime.votes).reduce((res, [k, v]) => {
            const parsed = parseInt(k)
            if (isNaN(parsed)) return res
            res.sum += parsed * v
            res.unique += v
            return res
        }, { sum: 0, unique: 0 })
        return {
            ...anime,
            score: unique == 0 ? 0 : sum / unique
        }
    })
    const topAnimes = ratedAnimes.sort((a, b) => b.score - a.score)
    const topAnimesFormatted = topAnimes.map((anime, i) => `${i + 1}. (${anime.score.toFixed(2)}) ${anime.name} / ${anime.russian}`)
    const topAnimesBlock = `Топ аниме (среднее значение):\n${topAnimesFormatted.slice(0, 10).join('\n')}`

    const perspectiveAnimes = animes.sort((a, b) => b.votes.planning - a.votes.planning)
    const perspectiveAnimesFormatted = perspectiveAnimes.map((anime, i) => `${i + 1}. (${anime.votes.planning}) ${anime.name} / ${anime.russian}`)
    const perspectiveAnimesBlock = `Перспективные аниме (запланированные):\n${perspectiveAnimesFormatted.slice(0, 10).join('\n')}`

    const ratedFixed = ratedAnimes.map(anime => {
        const votes = anime.votes
        const score = anime.score * (0.99 ** votes.not_planning) * (1.005 ** votes.planning) * (1.008 ** votes.not_finished) * (0.95 ** votes.dropped)
        return {
            ...anime,
            score: clamp(score, 0, 10)
        }
    })
    const topAnimesFixed = ratedFixed.sort((a, b) => b.score - a.score)
    const topAnimesFixedFormatted = topAnimesFixed.map((anime, i) => `${i + 1}. (${anime.score.toFixed(2)}) ${anime.name} / ${anime.russian}`)
    const topAnimesFixedBlock = `Топ аниме (моя формула):\n${topAnimesFixedFormatted.slice(0, 10).join('\n')}`

    const sumWatched = (a: Animes) => (['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as Answers[]).reduce((s, x) => s + a.votes[x], 0)
    const watched = animes.map(anime => ({ ...anime, watched: sumWatched(anime) }))
    const topWatched = watched.sort((a, b) => b.watched - a.watched)
    const topWatchedFormatted = topWatched.map((anime, i) => `${i + 1}. (${anime.watched}) ${anime.name} / ${anime.russian}`)
    const topWatchedBlock = `Топ просматриваемых:\n${topWatchedFormatted.slice(0, 10).join('\n')}`

    const MIN = 5
    const weightedScore = ratedAnimes.map(anime => {
        const total = sumWatched(anime)
        return {
            ...anime,
            score: total / (total + MIN) * anime.score + MIN / (total + MIN) * 7.2453
        }
    })
    const topWeighted = weightedScore.sort((a, b) => b.score - a.score)
    const topWeightedFormatted = topWeighted.map((anime, i) => `${i + 1}. (${anime.score.toFixed(2)}) ${anime.name} / ${anime.russian}`)
    const topWeightedBlock = `Топ аниме (формула WA):\n${topWeightedFormatted.slice(0, 10).join('\n')}`

    const topDropped = animes.sort((a, b) => b.votes.dropped - a.votes.dropped)
    const topDroppedFormatted = topDropped.map((anime, i) => `${i + 1}. (${anime.votes.dropped}) ${anime.name} / ${anime.russian}`)
    const topDroppedBlock = `Не оправдавшие надежды (дропнутые):\n${topDroppedFormatted.slice(0, 5).join('\n')}`

    try {
        await ctx.reply([totalBlock, topAnimesBlock, topWeightedBlock, topAnimesFixedBlock, perspectiveAnimesBlock, topWatchedBlock].join('\n\n'))
    } catch (e) {
        await ctx.reply(`Error: ${e}`)
    }
})

voting2.command('raw', async ctx => {
    const count = votes.count()
    const text = JSON.stringify(count)
    try {
        await ctx.replyWithDocument(new InputFile(Buffer.from(text), 'voting.json'))
    } catch (e) {
        await ctx.reply(`Error: ${e}`)
    }
})

voting2.command('rawer', async ctx => {
    const text = JSON.stringify(votes.raw())
    try {
        await ctx.replyWithDocument(new InputFile(Buffer.from(text), 'raw_voting.json'))
    } catch (e) {
        await ctx.reply(`Error: ${e}`)
    }
})

voting2.callbackQuery('voting:start', async ctx => {
    if (new Date() > until) {
        await ctx.answerCallbackQuery('Прости, время закончилось :(')
        return
    }
    await sendNext(ctx)
    await ctx.answerCallbackQuery()
})

voting2.callbackQuery(/^voting:(\d+):(not_planning|planning|dropped|not_finished|watched|main|1|2|3|4|5|6|7|8|9|10)(:final)?$/, async ctx => {
    if (new Date() > until) {
        await ctx.answerCallbackQuery('Прости, время закончилось :(')
        return
    }
    const id = Number(ctx.match[1])
    const answer = ctx.match[2] as (Answers | 'watched' | 'main')
    const final = !!ctx.match[3]
    const member = ctx.callbackQuery.from.id

    if (answer == 'watched' || answer == 'main') {
        try {
            await editMessage(ctx, id, answer, final)
        } catch (e) {

        }
    } else {
        votes.addVote(id, member, answer)

        try {
            await editMessage(ctx, id, answer, final)
        } catch (e) {

        }
        if (!final) {
            await sendNext(ctx, id)
        }
        await votes.save(VOTES_FILE)
    }

    await ctx.answerCallbackQuery()
})

async function sendNext(ctx: Context, id?: number) {
    const { id: nextId, anime } = votes.selectNext(id)
    if (!anime) {
        await ctx.api.sendMessage(ctx.callbackQuery!.from.id, `Ура! Вы проголосовали за все аниме. Вы можете поменять свой голос позже, если тыкните куда надо :3`)
        return
    }
    const keyboard = makeKeyboard(nextId)
    const message = makeMessage(anime)
    await ctx.api.sendMessage(ctx.callbackQuery!.from.id, message, {
        reply_markup: keyboard
    })
}

async function editMessage(ctx: Context, id: number, answer: (Answers | 'watched' | 'main'), final: boolean) {
    const anime = votes.get(id)
    let keyboard: InlineKeyboard
    if (answer == 'watched') {
        keyboard = makeRatingKeyboard(id, undefined, final)
    } else if (answer == 'main') {
        keyboard = makeKeyboard(id, undefined, final)
    } else if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(answer)) {
        keyboard = makeRatingKeyboard(id, answer, true)
    } else {
        keyboard = makeKeyboard(id, answer, true)
    }
    const message = makeMessage(anime)
    const chat_id = ctx.callbackQuery!.message!.chat.id
    const message_id = ctx.callbackQuery!.message!.message_id
    await ctx.api.editMessageText(chat_id, message_id, message, {
        reply_markup: keyboard
    })
}

function makeKeyboard(id: number, answer?: Answers, final: boolean = false) {
    return new InlineKeyboard()
        .text(
            addCheckmark(answer, 'planning') + 'Планирую',
            `voting:${id}:planning` + addFinal(final)
        )
        .text(
            addCheckmark(answer, 'not_planning') + 'Не планирую',
            `voting:${id}:not_planning` + addFinal(final)
        )
        .row()
        .text(
            addCheckmark(answer, 'not_finished') + 'Смотрю',
            `voting:${id}:not_finished` + addFinal(final)
        )
        .text(
            addCheckmark(answer, 'dropped') + 'Дропнул',
            `voting:${id}:dropped` + addFinal(final)
        )
        .row()
        .text(
            'Посмотрел',
            `voting:${id}:watched` + addFinal(final)
        )
}

function makeRatingKeyboard(id: number, answer?: Answers, final: boolean = false) {
    return new InlineKeyboard()
        .text(
            addCheckmark(answer, '1') + '1',
            `voting:${id}:1` + addFinal(final)
        )
        .text(
            addCheckmark(answer, '2') + '2',
            `voting:${id}:2` + addFinal(final)
        )
        .text(
            addCheckmark(answer, '3') + '3',
            `voting:${id}:3` + addFinal(final)
        )
        .text(
            addCheckmark(answer, '4') + '4',
            `voting:${id}:4` + addFinal(final)
        )
        .text(
            addCheckmark(answer, '5') + '5',
            `voting:${id}:5` + addFinal(final)
        )
        .row()
        .text(
            addCheckmark(answer, '6') + '6',
            `voting:${id}:6` + addFinal(final)
        )
        .text(
            addCheckmark(answer, '7') + '7',
            `voting:${id}:7` + addFinal(final)
        )
        .text(
            addCheckmark(answer, '8') + '8',
            `voting:${id}:8` + addFinal(final)
        )
        .text(
            addCheckmark(answer, '9') + '9',
            `voting:${id}:9` + addFinal(final)
        )
        .text(
            addCheckmark(answer, '10') + '10',
            `voting:${id}:10` + addFinal(final)
        )
        .row()
        .text(
            'Назад',
            `voting:${id}:main` + addFinal(final)
        )
}

function addCheckmark(a: string | undefined, b: string) {
    if (a === b) {
        return '✅ '
    }
    return ''
}

function addFinal(final: boolean) {
    return final ? ':final' : ''
}

function makeMessage(anime: { russian: string, name: string, url: string }) {
    return `${anime.russian} / ${anime.name}\nhttps://shikimori.me${anime.url}`
}