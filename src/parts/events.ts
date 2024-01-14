import { Composer, InlineKeyboard, Keyboard } from 'grammy'
import { Cache } from '../models/cache'
import { autoQuote } from '@roziscoding/grammy-autoquote'
import { EventModel } from '../models/events'

export const events = (cache: Cache) => {
    const events = new Composer
    const quoted = events.use(autoQuote)

    events.callbackQuery(/approve:.+/, async ctx => {
        // TODO
    })

    events.callbackQuery(/decline:.+/, async ctx => {
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
        // TODO
    })

    // TODO
}