import { Composer, InlineKeyboard, Keyboard } from 'grammy'
import { Cache } from '../models/cache'
import { autoQuote } from '@roziscoding/grammy-autoquote'
import { EventModel } from '../models/events'
import { TOKUID } from '../constants'

export const events = (cache: Cache) => {
    const events = new Composer
    const quoted = events.use(autoQuote)

    events.callbackQuery(/approve:(.+)/, async ctx => {
        if(ctx.from.id != TOKUID) {
            await ctx.answerCallbackQuery('Ты не Току -_-')
            return
        }

        const event = await EventModel.findById(ctx.match[1])
        if(!event) {
            await ctx.answerCallbackQuery('Чёто поломалось')
            return
        }

        event.approved = true
        await event.save()
        await ctx.answerCallbackQuery('Успешно поменяли')
        if(ctx.callbackQuery.message) {
            const msg = ctx.callbackQuery.message
            await ctx.api.editMessageText(msg.chat.id, msg.message_id, 'ОДОБРЕНО')
        }
    })

    events.callbackQuery(/decline:(.+)/, async ctx => {
        // TODO
    })

    quoted.command('row', async ctx => {
        const reply = ctx.msg.reply_to_message
        if(!reply || !reply.photo) {
            await ctx.reply('Ответьте на сообщение с картинкой, которую вы хотите поставить на аватарку')
            return
        }

        if(reply.caption) {
            await ctx.reply('Название чата можно поменять только при сборе всего бинго')
            return
        }

        const event = new EventModel({
            approved: false,
            duration: 1,
            pic: reply.photo.at(-1)
        })
        await event.save()
        await ctx.reply('Дождитесь одобрения @tokutonariwa', {
            reply_markup: new InlineKeyboard([[{
                text: 'Approve',
                callback_data: `approve:${event.id}`
            }, {
                text: 'Decline',
                callback_data: `decline:${event.id}`
            }]])
        })
    })

    quoted.command('full', async ctx => {
        const reply = ctx.msg.reply_to_message
        if(!reply || !reply.photo) {
            await ctx.reply('Ответьте на сообщение с картинкой, которую вы хотите поставить на аватарку')
            return
        }

        const event = new EventModel({
            approved: false,
            duration: reply.caption ? 1 : 7,
            name: reply.caption,
            pic: reply.photo.at(-1),
        })
        await event.save()
        await ctx.reply('Дождитесь одобрения @tokutonariwa', {
            reply_markup: new InlineKeyboard([[{
                text: 'Approve',
                callback_data: `approve:${event.id}`
            }, {
                text: 'Decline',
                callback_data: `decline:${event.id}`
            }]])
        })
    })

    // TODO
}