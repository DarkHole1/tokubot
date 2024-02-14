import { Api, Composer } from 'grammy'
import * as cron from 'node-cron'
import { TOKU_CHAT } from './constants'
import { AllFictionModel } from './models/all-fiction'

export const allFiction = (api: Api) => {
    const allFiction = new Composer

    let lastMessageId = 0

    allFiction.filter(
        ctx => ctx.chat?.id == TOKU_CHAT,
        async (ctx, next) => {
            if (ctx.msg?.message_id && ctx.msg.message_id > lastMessageId) {
                lastMessageId = ctx.msg.message_id
                if(lastMessageId % 10_000 == 0) {
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
        const doc = await findOrCreate()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayFormatted = [
            yesterday.getDate(),
            yesterday.getMonth() + 1,
            yesterday.getFullYear()
        ].map(n => n.toString().padStart(2, '0')).join('.')
        let estimated = ''
        if(doc.lastStats.length > 0) {
            const estimatedDays = (1_000_000 - lastMessageId) * doc.lastStats.length / doc.lastStats.reduce((a, b) => a + b)
            estimated = `Этого хватит приблизительно на ${estimatedDays.toFixed(0)} дней!`
        }

        try {
            await api.sendMessage(TOKU_CHAT, `Последнее сообщение на ${yesterdayFormatted} было под номером ${lastMessageId}! За сегодня было написано ${lastMessageId - doc.lastStartMessage} сообщений! До тепловой смерти чата осталось ${1_000_000 - lastMessageId} сообщений! ${estimated}`)
        } catch(e) {
            // Nothing
        }

        doc.lastStats.push(lastMessageId - doc.lastStartMessage)
        doc.lastStats = doc.lastStats.slice(-7)
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