import { autoQuote } from '@roziscoding/grammy-autoquote'
import { Composer } from 'grammy'
import { ProfileModel } from '../models/profile'

export const hanekawa = new Composer().use(autoQuote)

hanekawa.command('my', async ctx => {
    if (ctx.match.length) {
        await ctx.reply('Для использования напишите /my ссылка_на_ваш_аниме_профиль')
        return
    }

    await ctx.reply('К сожалению, эта ссылка не поддерживается')
})

hanekawa.command('yours', async ctx => {
    if(!ctx.message?.reply_to_message?.from?.id) {
        await ctx.reply('Для использования напишите /yours в ответ на сообщение пользователя')
        return
    }

    const profile = await ProfileModel.findOne({ telegramID: ctx.message.reply_to_message.from.id })
    if (!profile || !(profile.shikimoriUsername && profile.anilistUsername && profile.myanimelistUsernme)) {
        await ctx.reply('Я не знаю всего. Я знаю только то, что знаю.')
        return
    }

    const results = [] as string[]
    if(profile.shikimoriUsername) {
        results.push(`https://shikimori.one/${profile.shikimoriUsername}`)
    }
    if(profile.anilistUsername) {
        results.push(`https://anilist.co/user/${profile.anilistUsername}/`)
    }
    if(profile.shikimoriUsername) {
        results.push(`https://shikimori.one/${profile.shikimoriUsername}`)
    }

    await ctx.reply(results.join('\n'))
})