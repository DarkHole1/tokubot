import { Api, Composer } from 'grammy'
import * as cron from 'node-cron'
import { TOKU_CHAT } from './constants'
import { AllFictionModel } from './models/all-fiction'
import { getYesterdayCounter } from './parts/emoji-counter'
import { differenceInDays } from 'date-fns'
import OpenAI from 'openai'
import { zodTextFormat } from "openai/helpers/zod";
import { Config } from './config'
import debug from 'debug'
import { z } from 'zod'

const log = debug('tokubot:parts:all-fiction')

const Output = z.object({
    messageCount: z.string(),
    heatDeath: z.string(),
    emojiCount: z.string(),
    animelytic: z.string()
})
type Output = z.infer<typeof Output>  

export const allFiction = (api: Api, reset: () => Promise<void>, config: Config) => {
    const openai = new OpenAI({
        apiKey: config.PROXYAPI_TOKEN,
        baseURL: 'https://api.proxyapi.ru/openai/v1'
    })
    const allFiction = new Composer

    let lastMessageId = 0

    allFiction.filter(
        ctx => ctx.chat?.id == TOKU_CHAT,
        async (ctx, next) => {
            if (ctx.msg?.message_id && ctx.msg.message_id > lastMessageId) {
                lastMessageId = ctx.msg.message_id
                if (lastMessageId % 10_000 == 0) {
                    await ctx.reply(`Это было ${lastMessageId} сообщение`, {
                        reply_parameters: {
                            message_id: lastMessageId
                        }
                    })
                }
            }

            await next()
        }
    )

    cron.schedule('0 0 0 * * *', async () => {
        log('Started daily processing')
        const doc = await findOrCreate()
        const emoji = await getYesterdayCounter()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayFormatted = [
            yesterday.getDate(),
            yesterday.getMonth() + 1,
            yesterday.getFullYear()
        ].map(n => n.toString().padStart(2, '0')).join('.')
        const messagesLeft = 1000000 - lastMessageId
        const dailyMessages = lastMessageId - doc.lastStartMessage
        const weeklyAverage = doc.lastStats.concat(dailyMessages).reduce((a, b) => a + b) / (doc.lastStats.length + 1)
        const estimatedDays = messagesLeft / weeklyAverage
        let estimated = `Этого хватит приблизительно на ${estimatedDays.toFixed(0)} дней!`
        let emojiSummary = (comment: string) => ''
        if (emoji) {
            const sum = (a: Iterable<number>) => Array.from(a).reduce((a, b) => a + b)
            const maximum = <T>(a: Iterable<[T, number]>): T => Array.from(a).reduce((a, b) => a[1] >= b[1] ? a : b)[0]
            const overallEmojiCount = sum(emoji.overall.values())
            const theMostPopularEmoji = maximum(emoji.overall.entries())
            const theMostActiveEmojiUser = maximum(Array.from(emoji.byUser.values()).map(user => [user.name, sum(user.counters.values())] as [string, number]))
            // emojiSummary = `\n\nЗа сегодня было отправлено ${overallEmojiCount} эмодзи!\n\nСамый популярный эмодзи: ${theMostPopularEmoji}!\n\nСамый активный пользователь эмодзи: ${theMostActiveEmojiUser}!`
            emojiSummary = (comment: string) => `\n\nЗа сегодня было отправлено ${overallEmojiCount} эмодзи! ${comment}\n\nСамый популярный эмодзи: ${theMostPopularEmoji}!`
        }

        const animelytics = `\n\nПрошло ${differenceInDays(new Date(), new Date(2023, 9, 8, 10, 8))} дней с последнего поста в Анимелитике!`

        const generateResult = (output: Output) => 
            `Последнее сообщение на ${yesterdayFormatted} было под номером ${lastMessageId}!\n\nЗа сегодня было написано ${dailyMessages} сообщений! ${output.messageCount}\n\nДо тепловой смерти чата осталось ${messagesLeft} сообщений! ${output.heatDeath}\n\n${estimated}${emojiSummary(output.emojiCount)}${animelytics} ${output.animelytic}`
        let result = generateResult({
            messageCount: '', heatDeath: '', emojiCount: '', animelytic: ''
        })
        
        try {
            const response = await openai.responses.parse({
                model: "gpt-4o-mini-2024-07-18",
                input: [
                  { role: "system", content: "Напиши небольшой комментарий на каждое предложение из списка. Необходимо писать в повседневном тоне, быть кратким и не упоминать число в комментарии. Тематика чата: общение 90%, аниме 19%, манга 1%." },
                  {
                    role: "user",
                    content: result,
                  },
                ],
                text: {
                  format: zodTextFormat(Output, "output"),
                },
              })
          
              if (response.output_parsed) {
                  result = generateResult(response.output_parsed)
              }
        } catch (e) {
            log('Error %o', e)
            // Ignore error of generation
        }

        try {
            await api.sendMessage(TOKU_CHAT, result)
            await reset()
        } catch (e) {
            // Nothing
        }

        doc.lastStats.push(lastMessageId - doc.lastStartMessage)
        doc.lastStats = doc.lastStats.slice(-6)
        doc.lastStartMessage = lastMessageId
        await doc.save()
    })

    async function findOrCreate() {
        const doc = await AllFictionModel.findOne()
        if (doc) {
            return doc
        }
        return new AllFictionModel()
    }

    return allFiction
}