import { Bot, Context } from "grammy"
import cron from 'node-cron'
import { RawBRS } from "../models/brs"
import { readFileSync, writeFile } from "fs-extra"
import { DARK_HOLE, TOKU_CHAT } from "../constants"
import { guard, isPrivateChat } from "grammy-guard"
import { ParseModeFlavor } from "@grammyjs/parse-mode"

const brsFile = RawBRS.parse(JSON.parse(readFileSync('data/brs.json', { encoding: 'utf-8' })))

export function brs(bot: Bot<ParseModeFlavor<Context>>) {
    cron.schedule('0 0 10 * * *', async () => {
        const photo = brsFile.queue.shift()
        if (!photo) {
            return
        }
        brsFile.days++
        await bot.api.sendPhoto(TOKU_CHAT, photo, {
            caption: 'day ' + brsFile.days
        })
        await writeFile('data/brs.json', JSON.stringify(brsFile))
    })

    bot.on(':media', guard(isPrivateChat)).filter(
        ctx => ctx.from?.id == DARK_HOLE,
        async ctx => {
            const photo = ctx.msg.photo
            if (!photo) {
                await ctx.reply('Чот странное', { reply_to_message_id: ctx.msg.message_id })
                return
            }
            brsFile.queue.push(photo.slice(-1)[0].file_id)
            await writeFile('data/brs.json', JSON.stringify(brsFile))
            await ctx.reply(`Успешно добавлено на день ${brsFile.days + brsFile.queue.length}`, { reply_to_message_id: ctx.msg.message_id })
        }
    )
}