import { FormattedString, ParseModeFlavor, fmt, spoiler } from '@grammyjs/parse-mode'
import { autoQuote } from '@roziscoding/grammy-autoquote'
import debug from 'debug'
import { Composer, Context } from 'grammy'
import { ADMINS } from '../constants'
import { MessageEntity } from 'grammy/types'

const log = debug('app:unspoil')
const ROT_TIME = 5 * 60
export const unspoil = new Composer<ParseModeFlavor<Context>>().use(autoQuote)

function spoilerEntities(text: string, entities: MessageEntity[], range?: { offset: number, length: number }): FormattedString {
    const { offset, length } = range ?? { offset: 0, length: text.length }
    let start = offset, end = offset + length

    const filteredEntities = entities.filter(entity => {
        // Telegram forcefully unspoils monotype
        if (entity.type == 'pre' || entity.type == 'code')
            return false

        if (entity.type != 'spoiler')
            return true

        const entityStart = entity.offset, entityEnd = entity.offset + entity.length

        // Start overlap; extending
        if (entityStart < start && entityEnd > entityStart) {
            start = entityStart
        }

        // End overlap; extending
        if (entityStart < end && entityEnd > end) {
            end = entityEnd
        }

        if (entityStart >= start && entityEnd <= end)
            return false

        return true
    })

    return new FormattedString(
        text,
        filteredEntities.concat([{
            type: 'spoiler',
            offset: start,
            length: end - start
        }])
    )
}

function getSpoilText(text: string, entities: MessageEntity[], sender: string, reason: string, limit: number) {
    const spoilerReason = reason.length > 0 ? ` спойлер к ${reason}` : ``
    const ending = text.length > 0 ? `: ` : ``
    const header = `${sender} пишет${spoilerReason}${ending}`

    if (text.length >= limit - header.length) {
        text = text.slice(0, limit - header.length - 4) + '...'
    }

    return fmt`${header}${spoilerEntities(text, entities)}`
}

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
        const caption = getSpoilText(reply.caption ?? '', reply.caption_entities ?? [], sender, reason, 1024)
        await ctx.replyWithPhoto(
            reply.photo.at(-1)!.file_id,
            {
                caption: caption.text,
                caption_entities: caption.entities,
                has_spoiler: true
            }
        )
    } else if (reply.animation) {
        const caption = getSpoilText(reply.caption ?? '', reply.caption_entities ?? [], sender, reason, 1024)
        await ctx.replyWithAnimation(
            reply.animation.file_id,
            {
                caption: caption.text,
                caption_entities: caption.entities,
                has_spoiler: true
            }
        )
    } else if (reply.video) {
        const caption = getSpoilText(reply.caption ?? '', reply.caption_entities ?? [], sender, reason, 1024)
        await ctx.replyWithVideo(
            reply.video.file_id,
            {
                caption: caption.text,
                caption_entities: caption.entities,
                has_spoiler: true
            }
        )
    } else if (reply.text) {
        await ctx.replyFmt(
            getSpoilText(reply.text, reply.entities ?? [], sender, reason, 2048)
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
