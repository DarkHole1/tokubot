import { Composer } from "grammy"
import { autoQuote } from "@roziscoding/grammy-autoquote"

export const bingo = new Composer
const quoted = bingo.use(autoQuote)

quoted.command('bingo', ctx => ctx.reply('https://docs.google.com/spreadsheets/d/1QghSAYndgtDBDYPjEO1FNsMsP765zHK-wAFDF9Q1h9Y/edit#gid=0'))