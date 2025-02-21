import { autoQuote } from '@roziscoding/grammy-autoquote'
import { Composer } from 'grammy'
import { LIGHTING } from '../constants'

export const blessing = new Composer
const quoted = blessing.use(autoQuote)

// Похвала
quoted.on('msg').filter(_ => Math.random() > 0.998, async ctx => {
    const hours = new Date().getHours()
    if (hours >= 0 && hours <= 6 && Math.random() > 0.7) {
        await ctx.replyWithPhoto(LIGHTING)
        return
    }
    await ctx.reply('Ты умничка')
})

// Фрирен
quoted.on('msg').filter(_ => Math.random() > 0.99999, ctx => ctx.reply('Фрирен'))
