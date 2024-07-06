import { Bot, Context, GrammyError } from 'grammy'
import cron from 'node-cron'
import { CountersModel } from '../models/counters'
import { EverydayPostModel } from '../models/everyday-post'
import { DARK_HOLE, MARVIN_ID, TOKU_CHAT, XANDEX_ID } from '../constants'
import debug from 'debug'
import { ParseModeFlavor } from '@grammyjs/parse-mode'
import { isPrivateChat } from 'grammy-guard'

const log = debug('tokubot:everyday-post')

type Post = {
    type: string,
    caption: string,
    hours: number[],
    since?: Date
}

const SCHEDULE: Post[] = [{
    type: 'monogatari',
    caption: 'Daily Oddity number {count}',
    hours: [8, 16]
}, {
    type: 'everlasting summer',
    caption: 'Бесконечное лето день {count}',
    hours: [10],
    since: new Date('06/01/2024')
}, {
    type: 'world trigger',
    caption: 'Постим World Trigger день {count}',
    hours: [20]
}]

export function everydayPost<C extends Context>(bot: Bot<C>) {
    cron.schedule('0 0 * * * *', async () => {
        const now = new Date()
        const hour = now.getHours()
        const counters = await CountersModel.findOne()
        if (!counters) return
        for (const post of SCHEDULE) {
            if (post.since && post.since > now) {
                continue
            }
            if (!post.hours.includes(hour)) {
                continue
            }

            let current = counters.genericDays.get(post.type) ?? 0
            current++
            while (true) {
                const photo = await EverydayPostModel.findOne({ type: post.type })
                if (!photo) {
                    break
                }

                try {
                    const caption = post.caption.replace('{count}', current.toString())
                    await bot.api.sendPhoto(TOKU_CHAT, photo.fileId, { caption })
                    counters.genericDays.set(post.type, current)
                    await photo.deleteOne()
                    break
                } catch (e) {
                    if (e instanceof GrammyError && (e.description == 'Bad Request: failed to get HTTP URL content' || e.description == 'Bad Request: wrong file identifier/HTTP URL specified')) {
                        log('Picture unavailable, skipping')
                        await photo.deleteOne()
                        continue
                    }
                    log(e)
                    continue
                }
            }
        }
        await counters.save()
    })

    bot.on(':media').filter(
        ctx => isPrivateChat(ctx) && ctx.from?.id == MARVIN_ID,
        async ctx => {
            const type = 'monogatari'
            const photo = ctx.msg.photo
            if (!photo) {
                await ctx.reply('Чот странное', { reply_to_message_id: ctx.msg.message_id })
                return
            }
            const post = new EverydayPostModel({
                type,
                fileId: photo.slice(-1)[0].file_id
            })
            await post.save()

            const postCount = await EverydayPostModel.countDocuments({ type })
            const counters = await CountersModel.findOne()

            await ctx.reply(`Успешно добавлено на день ${(counters!.genericDays.get(type) ?? 0) + postCount}`, { reply_to_message_id: ctx.msg.message_id })
        }
    )

    bot.on(':media').filter(
        ctx => isPrivateChat(ctx) && ctx.from?.id == XANDEX_ID,
        async ctx => {
            const type = 'everlasting summer'
            const photo = ctx.msg.photo
            if (!photo) {
                await ctx.reply('Чот странное', { reply_to_message_id: ctx.msg.message_id })
                return
            }
            const post = new EverydayPostModel({
                type,
                fileId: photo.slice(-1)[0].file_id
            })
            await post.save()

            const postCount = await EverydayPostModel.countDocuments({ type })
            const counters = await CountersModel.findOne()

            await ctx.reply(`Успешно добавлено на день ${(counters!.genericDays.get(type) ?? 0) + postCount}`, { reply_to_message_id: ctx.msg.message_id })
        }
    )

    // bot.on(':media').filter(
    //     ctx => isPrivateChat(ctx) && ctx.from?.id == DARK_HOLE,
    //     async ctx => {
    //         const type = 'monogatari'
    //         const photo = ctx.msg.photo
    //         if (!photo) {
    //             await ctx.reply('Чот странное', { reply_to_message_id: ctx.msg.message_id })
    //             return
    //         }
    //         const post = new EverydayPostModel({
    //             type,
    //             fileId: photo.slice(-1)[0].file_id
    //         })
    //         await post.save()

    //         const postCount = await EverydayPostModel.countDocuments({ type })
    //         const counters = await CountersModel.findOne()

    //         await ctx.reply(`Успешно добавлено на день ${(counters!.genericDays.get(type) ?? 0) + postCount}`, { reply_to_message_id: ctx.msg.message_id })
    //     }
    // )
}
