import { Composer } from "grammy"

export const stats = new Composer

const botapp = `tokutonarinotofficialbot/tokubot`
// const botapp = `test1920341_bot/tokubot`

stats.command('weekly', (ctx) => ctx.reply(`Вот ваша статистика просмотренного за неделю`, {
    reply_parameters: {
        message_id: ctx.message?.message_id!
    },
    reply_markup: {
        inline_keyboard: [[{
            text: 'Узнать какие',
            url: `https://t.me/${botapp}?startapp=stats_${ctx.msg.sender_chat?.id ?? ctx.msg.from?.id}`
        }]]
    }
}))