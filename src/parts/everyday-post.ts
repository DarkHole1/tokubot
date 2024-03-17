import { Bot } from 'grammy'
import cron from 'node-cron'
import { CountersModel } from '../models/counters'
import { EverydayPostModel } from '../models/everyday-post'
import { TOKU_CHAT } from '../constants'
import debug from 'debug'

const log = debug('tokubot:everyday-post')

type Post = {
    type: string,
    caption: string,
    hours: number[]
}

const SCHEDULE: Post[] = [{
    type: 'monogatari',
    caption: 'Irregular Monogatari Posting Day ???',
    hours: [8]
}]

export function everydayPost(bot: Bot) {
    cron.schedule('0 0 * * * *', async () => {
        const counters = await CountersModel.findOne()
        if (!counters) return
        for (const post of SCHEDULE) {
            const photo = await EverydayPostModel.findOne({ type: post.type })
            if (!photo) {
                return
            }

            let current = counters.genericDays.get(post.type) ?? 0
            current++
            try {
                await bot.api.sendPhoto(TOKU_CHAT, photo.fileId, {
                    caption: post.caption
                })
            } catch (e) {
                log(e)
            }
            await photo.deleteOne()
        }
        await counters.save()
    })
}