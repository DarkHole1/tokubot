import { Bot, Context } from "grammy"
import cron from 'node-cron'
import { DARK_HOLE, TOKU_CHAT } from "../constants"
import { guard, isPrivateChat } from "grammy-guard"
import { ParseModeFlavor } from "@grammyjs/parse-mode"
import { CountersModel } from '../models/counters'
import { EverydayPostModel } from '../models/everyday-post'

const type = 'world trigger'
export function worldTrigger<C extends Context>(bot: Bot<C>) {
    cron.schedule('0 0 20 * * *', async () => {
        const counters = await CountersModel.findOne()
        const photo = await EverydayPostModel.findOne({ type })
        if (!counters || !photo) {
            return
        }

        counters.worldTriggerDays++
        await bot.api.sendPhoto(TOKU_CHAT, photo.fileId, {
            caption: 'Постим World Trigger день ' + counters.worldTriggerDays
        })
        await counters.save()
        await photo.deleteOne()
    })

    // bot.on(':media').filter(
    //     ctx => isPrivateChat(ctx) && ctx.from?.id == DARK_HOLE,
    //     async ctx => {
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

    //         await ctx.reply(`Успешно добавлено на день ${counters!.worldTriggerDays + postCount}`, { reply_to_message_id: ctx.msg.message_id })
    //     }
    // )
}