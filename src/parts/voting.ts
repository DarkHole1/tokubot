import { Composer, Context, InlineKeyboard } from "grammy"
import { Votes } from "../models/votes"
import * as statics from '../static'

const MIN_PERCENT = 0.3

export const voting = new Composer
const until = new Date('1 July 2023')
const votes = Votes.loadSync('data/votes.json')

voting.command('startvoting', async ctx => {
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

voting.command('rating', async ctx => {
    let title = 'Рейтинг:'
    let currentRating = votes.rating()
    if (new Date() > until) {
        title = 'Окончательный рейтинг:'
        currentRating = currentRating.filter(anime => anime.percent > MIN_PERCENT)
    }
    const formattedRating = currentRating.map((anime, i) => `${i + 1}. ${anime.votes}👍 (${(anime.percent * 100).toFixed(0)}%) ${anime.russian} / ${anime.name}`)
    
    await ctx.reply(title + '\n' + formattedRating.join('\n'), {
        reply_to_message_id: ctx.msg.message_id
    })
})

voting.callbackQuery('voting:start', async ctx => {
    if (new Date() > until) {
        await ctx.answerCallbackQuery('Прости, время закончилось :(')
        return
    }
    await sendNext(ctx)
    await ctx.answerCallbackQuery()
})

voting.callbackQuery(/voting:(\d+):(add|remove)(:final)?/, async ctx => {
    if (new Date() > until) {
        await ctx.answerCallbackQuery('Прости, время закончилось :(')
        return
    }
    const id = Number(ctx.match[1])
    const add = ctx.match[2] == 'add'
    const final = !!ctx.match[3]
    const member = ctx.callbackQuery.from.id
    if (add) {
        votes.addVote(id, member)
    } else {
        votes.removeVote(id, member)
    }

    try {
        await editMessage(ctx, id, add)
    } catch (e) {

    }
    if (!final) {
        await sendNext(ctx, id)
    }
    await votes.save('data/votes.json')
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

async function editMessage(ctx: Context, id: number, added: boolean) {
    const anime = votes.get(id)
    const keyboard = makeKeyboard(id, added, true)
    const message = makeMessage(anime)
    const chat_id = ctx.callbackQuery!.message!.chat.id
    const message_id = ctx.callbackQuery!.message!.message_id
    await ctx.api.editMessageText(chat_id, message_id, message, {
        reply_markup: keyboard
    })
}

function makeKeyboard(id: number, added?: boolean, final: boolean = false) {
    return new InlineKeyboard()
        .text(
            added == true ? '✅ За' : 'За',
            `voting:${id}:add${final ? ':final' : ''}`
        )
        .text(
            added == false ? '✅ Против' : 'Против',
            `voting:${id}:remove${final ? ':final' : ''}`
        )
}

function makeMessage(anime: { russian: string, name: string, url: string }) {
    return `${anime.russian} / ${anime.name}\nhttps://shikimori.me${anime.url}`
}