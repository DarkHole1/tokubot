import { Composer, Context, InlineKeyboard } from "grammy"
import { Answers, Votes2 } from "../models/votes2"
import * as statics from '../static'

export const voting2 = new Composer
const until = new Date('1 August 2023')
const votes = Votes2.loadSync('data/votes2.json')

voting2.command('startvoting', async ctx => {
    if (new Date() > until) {
        await ctx.reply('Прости, время закончилось :(')
        return
    }
    const inlineKeyboard = new InlineKeyboard().text('Понятненька', 'voting:start')
    try {
        await ctx.reply(statics.startVoting, {
            reply_markup: inlineKeyboard
        })
    } catch (e) {

    }
})

voting2.command('rating', async ctx => {
    const unique = votes.unique()
    const count = votes.count()

    const totalBlock = `Всего тайтлов: ${count.length}. Всего проголосовало: ${unique}.`

    const notInterecting = count.filter(anime => !Object.entries(anime.votes).some(([k, v]) => k != 'not_planning' && v != 0))
    const notInterectingFormatted = notInterecting.map(anime => `* ${anime.name} / ${anime.russian}`).join('\n')
    const notInterectingBlock = `Абсолютно неинтересные тайтлы:\n${notInterectingFormatted}`

    const ratedAnimes = count.map(anime => {
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
    const topAnimesBlock = `Топ аниме:\n${topAnimesFormatted.join('\n')}`

    try {
        await ctx.reply([totalBlock, topAnimesBlock].join('\n\n'))
        // const mapped = count.map(anime => `* ${anime.name} / ${anime.russian}:\n${Object.entries(anime.votes).filter(([_, v]) => v > 0).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`)
        // await ctx.reply(`Проголосовало ${unique} человек\nРезультаты:\n${mapped.slice(0, 25).join('\n')}`)
        // await ctx.reply(mapped.slice(25).join('\n'))
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
        await votes.save('data/votes2.json')
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