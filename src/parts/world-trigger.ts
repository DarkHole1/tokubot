import { Bot, Context } from "grammy"
import cron from 'node-cron'
import { RawBRS } from "../models/brs"
import { readFileSync, writeFile } from "fs-extra"
import { DARK_HOLE, TOKU_CHAT } from "../constants"
import { guard, isPrivateChat } from "grammy-guard"
import { ParseModeFlavor } from "@grammyjs/parse-mode"

const wtFile = RawBRS.parse(JSON.parse(readFileSync('data/world-trigger.json', { encoding: 'utf-8' })))

export function worldTrigger(bot: Bot<ParseModeFlavor<Context>>) {
    cron.schedule('0 0 20 * * *', async () => {
        const photo = wtFile.queue.shift()
        if (!photo) {
            return
        }
        wtFile.days++
        await bot.api.sendPhoto(TOKU_CHAT, photo, {
            caption: 'Постим World Trigger день ' + wtFile.days
        })
        await writeFile('data/world-trigger.json', JSON.stringify(wtFile))
    })

    bot.on(':media', guard(isPrivateChat)).filter(
        ctx => ctx.from?.id == DARK_HOLE,
        async ctx => {
            const photo = ctx.msg.photo
            if (!photo) {
                await ctx.reply('Чот странное', { reply_to_message_id: ctx.msg.message_id })
                return
            }
            wtFile.queue.push(photo.slice(-1)[0].file_id)
            await writeFile('data/world-trigger.json', JSON.stringify(wtFile))
            await ctx.reply(`Успешно добавлено на день ${wtFile.days + wtFile.queue.length}`, { reply_to_message_id: ctx.msg.message_id })
        }
    )
}