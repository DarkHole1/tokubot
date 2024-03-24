import { autoQuote } from '@roziscoding/grammy-autoquote'
import { Composer } from 'grammy'
import { ProfileDocument, ProfileModel } from '../models/profile'

export const hanekawa = new Composer().use(autoQuote)

hanekawa.command('my', async ctx => {
    if (ctx.match.length || !ctx.message?.from?.id) {
        await ctx.reply('Для использования напишите /my ссылка_на_ваш_аниме_профиль')
        return
    }

    let match = ctx.match.match(/^https:\/\/shikimori\.(?:one|me)\/([^\/]+)$/)
    if (match) {
        const profile = await findOrCreate(ctx.message.from.id)
        profile.shikimoriUsername = match[1]
        await profile.save()
        await ctx.reply('Добавила профиль на Шикимори')
        return
    }

    match = ctx.match.match(/^https:\/\/anilist\.co\/user\/([^\/]+)\/$/)
    if (match) {
        const profile = await findOrCreate(ctx.message.from.id)
        profile.anilistUsername = match[1]
        await profile.save()
        await ctx.reply('Добавила профиль на Анилисте')
        return
    }

    match = ctx.match.match(/^https:\/\/myanimelist\.net\/profile\/([^\/]+)$/)
    if (match) {
        const profile = await findOrCreate(ctx.message.from.id)
        profile.myanimelistUsernme = match[1]
        await profile.save()
        await ctx.reply('Добавила профиль на Мале')
        return
    }

    await ctx.reply('К сожалению, эта ссылка не поддерживается')
})

hanekawa.command('yours', async ctx => {
    if (!ctx.message?.reply_to_message?.from?.id) {
        await ctx.reply('Для использования напишите /yours в ответ на сообщение пользователя')
        return
    }

    const profile = await ProfileModel.findOne({ telegramID: ctx.message.reply_to_message.from.id })
    if (!profile || !(profile.shikimoriUsername && profile.anilistUsername && profile.myanimelistUsernme)) {
        await ctx.reply('Я не знаю всего. Я знаю только то, что знаю.')
        return
    }

    const results = [] as string[]
    if (profile.shikimoriUsername) {
        results.push(`https://shikimori.one/${profile.shikimoriUsername}`)
    }
    if (profile.anilistUsername) {
        results.push(`https://anilist.co/user/${profile.anilistUsername}/`)
    }
    if (profile.myanimelistUsernme) {
        results.push(`https://myanimelist.net/profile/${profile.myanimelistUsernme}`)
    }

    await ctx.reply(results.join('\n'))
})

async function findOrCreate(telegramID: number): Promise<ProfileDocument> {
    const res = await ProfileModel.findOne({ telegramID })
    if (res) {
        return res
    }
    return new ProfileModel({
        telegramID
    })
}