import { autoQuote } from '@roziscoding/grammy-autoquote'
import { Composer } from 'grammy'

export const blessing = new Composer
const quoted = blessing.use(autoQuote)

// Похвала
quoted.on('msg').filter(_ => Math.random() > 0.998, ctx => ctx.reply('Ты умничка'))

// Фрирен
quoted.on('msg').filter(_ => Math.random() > 0.99999, ctx => ctx.reply('Ты умничка'))
