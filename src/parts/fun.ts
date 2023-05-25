import { Composer } from "grammy"
import { COFFEE_STICKERS, SHOCK_PATALOCK, TEA_STICKERS, TOKU_CHAT, WORLD_TRIGGER, PON_STICKER } from "../constants"
import { DrinkCounters } from "../data"

export const fun = new Composer

const drinksCounters = DrinkCounters.fromFileSyncSafe('data/drinks.json')

// ШОК ПАТАЛОК
fun.hears(/п(а|a)т(а|a)л(о|o)к|501\s?271|область/gim, ctx => ctx.replyWithAudio(SHOCK_PATALOCK, { reply_to_message_id: ctx.msg.message_id }))

fun.hears(/триггер/gim, ctx => ctx.replyWithSticker(WORLD_TRIGGER, { reply_to_message_id: ctx.msg.message_id }))

// Пон
fun.hears(/(\s|^)пон(\s|$)/gim, ctx => ctx.replyWithSticker(PON_STICKER, { reply_to_message_id: ctx.msg.message_id }))

fun.on(':sticker').filter(ctx => ctx.msg.chat.id == TOKU_CHAT, async ctx => {
    const sticker = ctx.msg.sticker.file_unique_id
    let drink: string
    let count: number
    let emoji: string
    let achivement = ''

    if(!TEA_STICKERS.concat(COFFEE_STICKERS).includes(sticker)) {
        return
    }

    if(TEA_STICKERS.includes(sticker)) {
        drinksCounters.tea += 1
        drink = 'чя'
        count = drinksCounters.tea
        emoji = '🍵'
        switch(count) {
            case 1:
                achivement = 'Чай буш?'
                break
            case 28:
                achivement = 'Вы выпили ведро чя :0'
                break
            case 75:
                achivement = 'Хватит на аквариум. С чаем.'
                break
            case 100:
                achivement = 'Твой чй пронзит небеса!'
                break
            case 150:
                achivement = '"Я должен был пить много чая, ибо без него не мог работать. Чай высвобождает те возможности, которые дремлют в глубине моей души." Лев Толстой'
                break
            case 200:
                achivement = 'Пора заводить чаегонный аппарт на 60 литров.'
            case 250:
                achivement = 'Теперь вы полностью состоите из чая.'
                break
            case 300:
                achivement = 'Хватит чтобы наполнить стиральную машину. Чаем, конечно же.'
            case 1337:
                achivement = '31337 t34'
                break
        }
    } else {
        drinksCounters.coffee += 1
        drink = 'кфе'
        count = drinksCounters.coffee
        emoji = '☕️'
        switch(count) {
            case 1:
                achivement = 'На этом ты не остановишься. Так мне сказал мой побочный эффект.'
                break
            case 50:
                achivement = 'What is this, a coffee episode?'
                break
            case 75:
                achivement = 'Ничто на свете не даётся даром. Даже кофе.'
            case 100:
                achivement = 'Ты выпил 100 чашек кофе? Как мило'
                break
            case 150:
                achivement = 'Во-первых, у тебя лишь сто пятьдесят чашек кофе. Во-вторых, делай, как я говорю, и не вздумай пить меньше кофе. В-третьих, что бы ни было в прошлом, чашки чая тебя не касаются'
                break
            case 200:
                achivement = 'Сломай систему, посмотри аниме, где милые девочки пьют кфе.'
                break
            case 250:
                achivement = 'Wonder Coffee Priority'
                break
            case 300:
                achivement = 'Half human, half coffee, completely awesome.'
                break
            case 1300:
                achivement = 'Этого достаточно чтобы наполнить ванну!'
                break
        }
    }

    await drinksCounters.toFile('data/drinks.json')
    await ctx.reply(`Приятного! Попили ${drink} ${count} раз ${emoji}\n${achivement}`, {
        reply_to_message_id: ctx.msg.message_id
    })
})
