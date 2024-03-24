import { autoQuote } from '@roziscoding/grammy-autoquote'
import { Composer } from 'grammy'

export const hanekawa = new Composer().use(autoQuote)

hanekawa.command('my', async ctx => {
    if (ctx.match.length) {
        await ctx.reply('Для использования напишите /my ссылка_на_ваш_аниме_профиль')
        return
    }

    await ctx.reply('К сожалению, эта ссылка не поддерживается')
})

hanekawa.command('yours', async ctx => {
    // TODO
})