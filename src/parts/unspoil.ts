import { ParseModeFlavor, fmt, spoiler } from '@grammyjs/parse-mode'
import { autoQuote } from '@roziscoding/grammy-autoquote'
import debug from 'debug'
import { Composer, Context } from 'grammy'
import { ADMINS } from '../constants'

const log = debug('app:unspoil')
const ROT_TIME = 5 * 60
export const unspoil = new Composer<ParseModeFlavor<Context>>().use(autoQuote)

unspoil.command('unspoil', async ctx => {
    const reply = ctx.msg.reply_to_message
    // Let's assume that if sender added spoiler to media they remember to add spoiler to text too. Or maybe we chould resend regardless of media spoiler on original message
    if (!reply || reply.has_media_spoiler || reply.sticker || reply.story) {
        await ctx.reply('Для того чтобы убрать спойлер ответьте на сообщение')
        return
    }

    const isAdmin = ctx.from ? ADMINS.includes(ctx.from.id) : false

    if (Date.now() / 1000 - reply.date > ROT_TIME && !isAdmin) {
        await ctx.reply('Сообщение слишком старое')
        return
    }

    if (reply.from?.id == ctx.me.id && !isAdmin) {
        return
    }

    const sender = reply.from?.username ?? reply.from?.first_name ?? 'Анонимус'
    const reason = ctx.match.trim()

    if (reply.photo) {
        await ctx.replyWithPhoto(
            reply.photo.at(-1)!.file_id,
            {
                caption: reply.caption,
                caption_entities: reply.caption_entities,
                has_spoiler: true
            }
        )
    } else if (reply.animation) {
        await ctx.replyWithAnimation(
            reply.animation.file_id,
            {
                caption: reply.caption,
                caption_entities: reply.caption_entities,
                has_spoiler: true
            }
        )
    } else if (reply.video) {
        await ctx.replyWithVideo(
            reply.video.file_id,
            {
                caption: reply.caption,
                caption_entities: reply.caption_entities,
                has_spoiler: true
            }
        )
    } else if (reply.text) {
        const spoilerReason = reason.length > 0 ? ` спойлер к ${reason}` : ``
        const header = `${sender} пишет${spoilerReason}: `
        let text = reply.text
        if (text.length >= 2048 - header.length) {
            text = text.slice(0, 2048 - header.length - 4) + '...'
        }
        await ctx.replyFmt(
            fmt`${header}${spoiler(reply.text)}`
        )
    } else {
        return
    }

    try {
        await ctx.api.deleteMessage(reply.chat.id, reply.message_id)
    } catch (e) {
        log(e)
    }
})
