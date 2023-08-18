import { Composer, InlineKeyboard } from 'grammy'
import * as https from 'node:https'
import sagiri from 'sagiri'
import { Config } from '../config'


export const backArrow = (config: Config) => {
    const res = new Composer
    const client = sagiri(config.SAGIRI_TOKEN)

    res.command('backarrow', async ctx => {
        if (!ctx.msg.reply_to_message || !ctx.msg.reply_to_message.photo) {
            return
        }
        const msg = await ctx.reply('Meowing back...', { reply_to_message_id: ctx.msg.message_id })

        try {
            const photos = ctx.msg.reply_to_message.photo
            const photo = photos.slice(-1)[0]
            const file = await ctx.api.getFile(photo.file_id)
            const file_path = `https://api.telegram.org/file/bot${config.TOKEN}/${file.file_path}`
            https.get(file_path, async stream => {
                const res = await client(stream)
                const buttons = res.filter(res => res.similarity >= 60).map(res => ({ text: res.site + ' ' + res.similarity, url: res.url }))
                const keyboard = new InlineKeyboard(chunk(buttons, 3))
                await ctx.api.editMessageText(msg.chat.id, msg.message_id, 'Meow', {
                    reply_markup: keyboard
                })
            })
        } catch (e) {
            await ctx.api.editMessageText(msg.chat.id, msg.message_id, 'Something meow wrong')
        }
    })

    return res
}

function chunk<T>(array: T[], chunkSize: number): T[][] {
    const res = [] as T[][]
    for (let i = 0; i < array.length; i += chunkSize) {
        res.push(array.slice(i, i + chunkSize))
    }
    return res
}