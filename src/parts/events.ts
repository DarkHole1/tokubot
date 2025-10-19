import { Bot, Composer, InlineKeyboard, Keyboard } from 'grammy'
import { Cache } from '../models/cache'
import { autoQuote } from '@roziscoding/grammy-autoquote'
import { EventModel } from '../models/events'
import { TOKUID, DARK_HOLE, TOKU_CHAT } from '../constants'
import { schedule } from 'node-cron'
import { Chat, ChatFullInfo, InputFile } from 'grammy/types'
import debug from 'debug'
import { Config } from '../config'
import axios from 'axios'

const log = debug('tokubot:events')

export const events = (cache: Cache, bot: Bot, config: Config) => {
    const events = new Composer
    const quoted = events.use(autoQuote)

    events.callbackQuery(/approve:(.+)/, async ctx => {
        if (ctx.from.id != DARK_HOLE) {
            await ctx.answerCallbackQuery('Ты не Дарк -_-')
            return
        }

        const event = await EventModel.findById(ctx.match[1])
        if (!event) {
            await ctx.answerCallbackQuery('Чёто поломалось')
            return
        }

        event.approved = true
        await event.save()
        await ctx.answerCallbackQuery('Успешно одобрили')
        if (ctx.callbackQuery.message) {
            const msg = ctx.callbackQuery.message
            await ctx.api.editMessageText(msg.chat.id, msg.message_id, 'ОДОБРЕНО')
        }
    })
    
    events.on(':new_chat_photo', async ctx => {
        if(ctx.msg.from?.id == ctx.me.id) return
        log('Setting new original picture')
        cache.setOriginalPic(ctx.msg.new_chat_photo.at(-1)!.file_id)
        await cache.save()
    })

    events.callbackQuery(/decline:(.+)/, async ctx => {
        if (ctx.from.id != TOKUID) {
            await ctx.answerCallbackQuery('Ты не Току -_-')
            return
        }

        const event = await EventModel.findById(ctx.match[1])
        if (!event) {
            await ctx.answerCallbackQuery('Чёто поломалось')
            return
        }

        await event.deleteOne()
        await ctx.answerCallbackQuery('Успешно отклонили')
        if (ctx.callbackQuery.message) {
            const msg = ctx.callbackQuery.message
            await ctx.api.editMessageText(msg.chat.id, msg.message_id, 'НЕОДОБРЕНО')
        }
    })

    quoted.command('row', async ctx => {
        const reply = ctx.msg.reply_to_message
        if (!reply || !reply.photo) {
            await ctx.reply('Ответьте на сообщение с картинкой, которую вы хотите поставить на аватарку')
            return
        }

        if (reply.caption) {
            await ctx.reply('Название чата можно поменять только при сборе всего бинго')
            return
        }

        const event = new EventModel({
            approved: false,
            duration: 1,
            pic: reply.photo.at(-1)!.file_id
        })
        await event.save()
        await ctx.reply('Вы поставите аватарку на 1 день. Дождитесь одобрения @darkhole1', {
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
        if (!reply || !reply.photo) {
            await ctx.reply('Ответьте на сообщение с картинкой, которую вы хотите поставить на аватарку')
            return
        }

        const event = new EventModel({
            approved: false,
            duration: reply.caption ? 1 : 7,
            name: reply.caption,
            pic: reply.photo.at(-1)!.file_id,
        })
        await event.save()
        await ctx.reply(`Вы поставите аватарку${reply.caption ? `и название` : ``} на ${reply.caption ? `1 день` : `7 дней`}. Дождитесь одобрения @toku_tonari`, {
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
        try {
            log('Starting event check')
            const event = await EventModel.findOne({ approved: true })
            if (event) {
                log('Event found: %o', event)
                const chatInfo = await bot.api.getChat(TOKU_CHAT) as ChatFullInfo.SupergroupChat
                if (event.name && !cache.name.is_event) {
                    cache.startNameEvent(chatInfo.title)
                }
                if (event.pic && !cache.pic.is_event) {
                    cache.startPicEvent()
                }
                await cache.save()

                if (event.name && chatInfo.title != event.name) {
                    await bot.api.setChatTitle(TOKU_CHAT, event.name)
                }
                if (event.pic && chatInfo.photo?.big_file_id != event.pic) {
                    await bot.api.setChatPhoto(TOKU_CHAT, await id2input(event.pic))
                    const newChatInfo = await bot.api.getChat(TOKU_CHAT) as ChatFullInfo.SupergroupChat
                    event.pic = newChatInfo.photo!.big_file_id
                }

                event.duration -= 1
                if (event.duration == 0) {
                    await event.deleteOne()
                } else {
                    await event.save()
                }
            } else {
                if (cache.name.is_event) {
                    await bot.api.setChatTitle(TOKU_CHAT, cache.name.original)
                    cache.stopNameEvent()
                }
                if (cache.pic.is_event) {
                    await bot.api.setChatPhoto(TOKU_CHAT, await id2input(cache.pic.original))
                    cache.stopPicEvent()
                }
                await cache.save()
            }
        } catch (e) {
            console.error(e)
        }
    })

    async function id2input(file_id: string) {
        const file = await bot.api.getFile(file_id)
        const file_path = `https://api.telegram.org/file/bot${config.TOKEN}/${(file as any).file_path}`
        const res = await axios.get(file_path, { responseType: 'arraybuffer' })
        const buffer = res.data
        return new InputFile(Buffer.from(buffer), 'image')
    }

    return events
}