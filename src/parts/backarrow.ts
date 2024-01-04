import { fmt, code, bold, FormattedString } from '@grammyjs/parse-mode'
import axios from 'axios'
import { Composer, InlineKeyboard } from 'grammy'
import * as https from 'node:https'
import sagiri, { SagiriResult } from 'sagiri'
import { Config } from '../config'
import { DanbooruPostWithTags } from '../models/danbooru-post'
import debug from 'debug'

const log = debug('tokubot:backarrow')

export const backArrow = (config: Config) => {
    const res = new Composer
    const client = sagiri(config.SAGIRI_TOKEN)

    res.command('backarrow', async ctx => {
        if (!ctx.msg.reply_to_message || !ctx.msg.reply_to_message.photo) {
            return
        }
        const msg = await ctx.reply('Meowing back...', { reply_to_message_id: ctx.msg.message_id })

        try {
            const photos = ctx.msg.reply_to_message.photo
            const photo = photos.slice(-1)[0]
            const file = await ctx.api.getFile(photo.file_id)
            const file_path = `https://api.telegram.org/file/bot${config.TOKEN}/${file.name}`
            https.get(file_path, async stream => {
                const res = await client(stream)
                const filteredRes = res.filter(res => res.similarity >= 60)
                
                const meta = await getMetadata(filteredRes)
                const text = fmt`Meow\n${formatMetadata(meta)}`
                
                const buttons = filteredRes.map(res => ({ text: res.site + ' ' + res.similarity + '%', url: res.url }))
                const keyboard = new InlineKeyboard(chunk(buttons, 3))
                await ctx.api.editMessageText(msg.chat.id, msg.message_id, text.toString(), {
                    reply_markup: keyboard,
                    entities: text.entities
                })
            })
        } catch (e) {
            await ctx.api.editMessageText(msg.chat.id, msg.message_id, 'Something meow wrong')
        }
    })

    return res
}

function chunk<T>(array: T[], chunkSize: number): T[][] {
    const res = [] as T[][]
    for (let i = 0; i < array.length; i += chunkSize) {
        res.push(array.slice(i, i + chunkSize))
    }
    return res
}

type Metadata = {
    author: string[],
    characters: string[],
    origin: string[]
} | null

async function getMetadata(res: SagiriResult[]): Promise<Metadata> {
    const danbooruPost = res.find(res => res.site == 'Danbooru')
    if (!danbooruPost) {
        log('Danbooru post not found')
        return null
    }
    try {
        const postId = danbooruPost.raw.data.danbooru_id!
        log('Found danbooru post with id %d', postId)
        const { data } = await axios.get<unknown>(`https://testbooru.donmai.us/posts/${postId}.json`)
        const parsed = DanbooruPostWithTags.parse(data)
        return {
            author: parsed.tags_artist,
            characters: parsed.tags_character,
            origin: parsed.tags_copyright
        }
    } catch (e) {
        log('An error occured: %o', e)
    }
    return null
}

function formatMetadata(meta: Metadata): FormattedString {
    if(!meta) {
        return fmt``
    }
    const preprocess = (arr: string[], title: string) => {
        const entities = arr.map(author => code(author)).reduce((a, b) => fmt`${a}, ${b}`)
        const line = arr.length > 0 ? fmt`${bold(title)} ${entities}\n` : ''
        return line
    }

    const authorLine = preprocess(meta.author, 'Author:')
    const originLine = preprocess(meta.characters, 'From:')
    const charLine = preprocess(meta.characters, 'Characters:')

    return fmt`${authorLine}${originLine}${charLine}`
}