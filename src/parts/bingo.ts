import { Composer } from "grammy"
import { autoQuote } from "@roziscoding/grammy-autoquote"

export const bingo = new Composer
const quoted = bingo.use(autoQuote)

quoted.command('bingo', ctx => ctx.reply('https://docs.google.com/spreadsheets/d/1DErtjsrgaIxo1HvB_ETu6v3H-d43RkOItJ284nm7H4Y/edit?usp=sharing'))