import { Bot, Composer, InlineKeyboard, Keyboard } from 'grammy'
import { Cache } from '../models/cache'
import { autoQuote } from '@roziscoding/grammy-autoquote'
import { EventModel } from '../models/events'
import { TOKUID, TOKU_CHAT } from '../constants'
import { schedule } from 'node-cron'
import { Chat, InputFile } from 'grammy/types'

export const events = (cache: Cache, bot: Bot) => {
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
        await ctx.answerCallbackQuery('Успешно одобрили')
        if(ctx.callbackQuery.message) {
            const msg = ctx.callbackQuery.message
            await ctx.api.editMessageText(msg.chat.id, msg.message_id, 'ОДОБРЕНО')
        }
    })

    events.callbackQuery(/decline:(.+)/, async ctx => {
        if(ctx.from.id != TOKUID) {
            await ctx.answerCallbackQuery('Ты не Току -_-')
            return
        }

        const event = await EventModel.findById(ctx.match[1])
        if(!event) {
            await ctx.answerCallbackQuery('Чёто поломалось')
            return
        }

        await event.deleteOne()
        await ctx.answerCallbackQuery('Успешно отклонили')
        if(ctx.callbackQuery.message) {
            const msg = ctx.callbackQuery.message
            await ctx.api.editMessageText(msg.chat.id, msg.message_id, 'НЕОДОБРЕНО')
        }
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

    schedule('0 0 0 * * *', async () => {
        const event = await EventModel.findOne({ approved: true })
        if(event) {
            const chatInfo = await bot.api.getChat(TOKU_CHAT) as Chat.SupergroupGetChat
            if(event.name && !cache.name.is_event) {
                cache.startNameEvent(chatInfo.title)
            }
            if(event.pic && !cache.pic.is_event) {
                cache.startPicEvent(chatInfo.photo!.big_file_id)
            }
            await cache.save()

            if(event.name && chatInfo.title != event.name) {
                await bot.api.setChatTitle(TOKU_CHAT, event.name)
            }
            if(event.pic && chatInfo.photo?.big_file_id != event.pic) {
                await bot.api.setChatPhoto(TOKU_CHAT, new InputFile(event.pic))
                const newChatInfo = await bot.api.getChat(TOKU_CHAT) as Chat.SupergroupGetChat
                event.pic = newChatInfo.photo!.big_file_id
            }

            event.duration -= 1;
            if(event.duration == 0) {
                await event.deleteOne()
            } else {
                await event.save()
            }
        } else {
            if(cache.name.is_event) {
                await bot.api.setChatTitle(TOKU_CHAT, cache.name.original)
                cache.stopNameEvent()
            }
            if(cache.pic.is_event) {
                await bot.api.setChatPhoto(TOKU_CHAT, new InputFile(cache.pic.original))
                cache.stopPicEvent()
            }
            await cache.save()
        }
    })
}