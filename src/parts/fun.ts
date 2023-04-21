import { Composer } from "grammy"
import { COFFEE_STICKERS, SHOCK_PATALOCK, TEA_STICKERS, TOKU_CHAT, WORLD_TRIGGER } from "../constants"
import { DrinkCounters } from "../data"

export const fun = new Composer

const drinksCounters = DrinkCounters.fromFileSyncSafe('data/drinks.json')

// ШОК ПАТАЛОК
fun.hears(/п(а|a)т(а|a)л(о|o)к|501|271|область/gim, ctx => ctx.replyWithAudio(SHOCK_PATALOCK, { reply_to_message_id: ctx.msg.message_id }))

fun.hears(/триггер/gim, ctx => ctx.replyWithSticker(WORLD_TRIGGER, { reply_to_message_id: ctx.msg.message_id }))

fun.on(':sticker').filter(ctx => ctx.msg.chat.id == TOKU_CHAT, async ctx => {
    const sticker = ctx.msg.sticker.file_unique_id
    let drink: string
    let count: number
    let emoji: string

    if(!TEA_STICKERS.concat(COFFEE_STICKERS).includes(sticker)) {
        return
    }

    if(TEA_STICKERS.includes(sticker)) {
        drinksCounters.tea += 1
        drink = 'чя'
        count = drinksCounters.tea
        emoji = '🍵'
    } else {
        drinksCounters.coffee += 1
        drink = 'кфе'
        count = drinksCounters.coffee
        emoji = '☕️'
    }

    await drinksCounters.toFile('data/drinks.json')
    await ctx.reply(`Приятного! Попили ${drink} ${count} раз ${emoji}`, {
        reply_to_message_id: ctx.msg.message_id
    })
})