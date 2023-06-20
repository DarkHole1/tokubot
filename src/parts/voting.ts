import { autoQuote } from "@roziscoding/grammy-autoquote"
import { Composer, InlineKeyboard } from "grammy"
import { Votes } from "../models/votes"
import * as statics from '../static'

export const voting = new Composer
const until = new Date('1 June 2023')
const votes = Votes.loadSync('data/votes.json')

voting.use(autoQuote)

voting.command('/startvoting', async ctx => {
    if (new Date() > until) {
        await ctx.reply('Прости, время закончилось :(')
        return
    }
    const inlineKeyboard = new InlineKeyboard().text('Понятненька', 'voting:start')
    await ctx.reply(statics.startVoting, {
        reply_markup: inlineKeyboard
    })
})

voting.callbackQuery('voting:start', async ctx => {
    if (new Date() > until) {
        await ctx.answerCallbackQuery('Прости, время закончилось :(')
        return
    }
    const anime = votes.get(0)
    const keyboard = new InlineKeyboard().text('За', 'voting:0:add').text('Против', 'voting:0:remove')
    await ctx.api.sendMessage(ctx.callbackQuery.chat_instance, `${anime.russian} / ${anime.name}\n${anime.url}`, {
        reply_markup: keyboard
    })
    await ctx.answerCallbackQuery()
})

voting.callbackQuery(/voting:(\d+):(add|remove)(:final)?/, async ctx => {
    if (new Date() > until) {
        await ctx.answerCallbackQuery('Прости, время закончилось :(')
        return
    }
    const id = Number(ctx.match[1])
    const add = ctx.match[2] == 'add'
    const final = ctx.match[3] != ''
    const member = ctx.callbackQuery.from.id
    const keyboard = new InlineKeyboard()
    if (add) {
        votes.addVote(id, member)
        keyboard.text('✅ За', `voting:${id}:add:final`).text('Против', `voting:${id}:remove:final`)
    } else {
        votes.removeVote(id, member)
        keyboard.text('За', `voting:${id}:add:final`).text('✅ Против', `voting:${id}:remove:final`)
    }
    const chat_id = ctx.callbackQuery.message!.chat.id
    const message_id = ctx.callbackQuery.message!.message_id
    const anime = votes.get(id)
    await ctx.api.editMessageText(chat_id, message_id, `${anime.russian} / ${anime.name}\n${anime.url}`)
    if (!final) {
        const newAnime = votes.get(id + 1)
        if (newAnime) {
            const keyboard = new InlineKeyboard().text('За', `voting:${id + 1}:add`).text('Против', `voting:${id + 1}:remove`)
            await ctx.api.sendMessage(ctx.callbackQuery.chat_instance, `${newAnime.russian} / ${newAnime.name}\n${newAnime.url}`, {
                reply_markup: keyboard
            })
        } else {
            await ctx.api.sendMessage(ctx.callbackQuery.chat_instance, `Ура! Вы проголосовали за все аниме. Вы можете поменять свой голос позже, если тыкните куда надо :3`)
        }
    }
    await ctx.answerCallbackQuery()
})