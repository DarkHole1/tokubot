import { Bot, Context } from 'grammy'
import cron from 'node-cron'
import { CountersModel } from '../models/counters'
import { EverydayPostModel } from '../models/everyday-post'
import { TOKU_CHAT } from '../constants'
import debug from 'debug'
import { ParseModeFlavor } from '@grammyjs/parse-mode'

const log = debug('tokubot:everyday-post')

type Post = {
    type: string,
    caption: string,
    hours: number[]
}

const SCHEDULE: Post[] = [{
    type: 'monogatari',
    caption: 'Irregular Monogatari Posting Day ???',
    hours: [11]
}]

export function everydayPost(bot: Bot<ParseModeFlavor<Context>>) {
    cron.schedule('0 0 * * * *', async () => {
        const now = new Date()
        const hour = now.getHours()
        const counters = await CountersModel.findOne()
        if (!counters) return
        for (const post of SCHEDULE) {
            if(!post.hours.includes(hour)) {
                return
            }
            
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
                counters.genericDays.set(post.type, current)
            } catch (e) {
                log(e)
            }
            await photo.deleteOne()
        }
        await counters.save()
    })
}