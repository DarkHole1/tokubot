import { Composer } from "grammy"
import { autoQuote } from "@roziscoding/grammy-autoquote"

export const bingo = new Composer
const quoted = bingo.use(autoQuote)

quoted.command('bingo', ctx => ctx.reply('https://docs.google.com/spreadsheets/d/1znxn6x-5W7qyHz8BBWFT3mpU58ibYj8cs1jKsCNo_10/edit?usp=sharing'))
