import { autoQuote } from '@roziscoding/grammy-autoquote'
import debug from 'debug'
import { Composer } from 'grammy'

const log = debug('app:unspoil')
export const unspoil = new Composer().use(autoQuote)

unspoil.command('unspoil', async ctx => {
    const reply = ctx.msg.reply_to_message
   //if (!reply || (!reply.photo && !reply.animation && !reply.video) || reply.has_media_spoiler) {
    if (!reply || reply.has_media_spoiler) {//let's assume that if sender added spoiler to media they remember to add spoiler to text too. Or maybe we chould resend regardless of media spoiler on original message
        await ctx.reply('Для того чтобы убрать спойлер ответьте на сообщение')
        //await ctx.reply('Для того чтобы убрать спойлер ответьте на сообщение с кортинкой / гифкай')
        return
    }

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
    }
    if (reply.text) {
        await ctx.replyFmt(
             fmt`${reply.from.username} пишет: ${spoiler(reply.text)}`
        )
    }
    try {
        await ctx.api.deleteMessage(reply.chat.id, reply.message_id)
    } catch (e) {
        log(e)
    }
})
