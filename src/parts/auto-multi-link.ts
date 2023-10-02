import { autoQuote } from '@roziscoding/grammy-autoquote'
import { Composer } from 'grammy'
import { API } from 'shikimori'

const shikimori = new API({
    userAgent: 'Toku-bot'
})

export const autoMultiLink = new Composer().use(autoQuote)

type UniversalID = { type: keyof typeof handlers, id: string }

type Handler = {
    extractor: (url: string) => UniversalID | null
    resolve: (ids: AllIDs) => Promise<boolean>
}

type AllIDs = { [type: keyof typeof handlers]: string | null }

const handlers: { [key: string]: Handler } = {
    shikimori: {
        extractor(url) {
            const match = url.match(/shikimori.(?:me|one)\/animes\/.+?(\d+)/)
            if (!match) {
                return null
            }
            return { type: 'shikimori', id: match[1] }
        },

        async resolve(ids: AllIDs) {
            // if(ids.shikimori)
            return false
        }
    }
}

async function resolveGlobal(uid: UniversalID): Promise<AllIDs> {
    let res: AllIDs = {
        shikimori: null
    }
    res[uid.type] = uid.id

    let changed
    do {
        changed = false
        for (const handler of Object.values(handlers)) {
            changed ||= await handler.resolve(res)
        }
    } while (changed)
    
    return res
}

async function resolveName(ids: AllIDs): Promise<[ string, string ] | [string] | null> {
    return null
}

autoMultiLink.command('i', async ctx => {
    const msg = ctx.msg.reply_to_message
    if (!msg || !msg.entities || !msg.text) return
    for (const entity of msg.entities) {
        let url
        if (entity.type == 'text_link') {
            url = entity.url
        } else if (entity.type == 'url') {
            url = msg.text.slice(entity.offset, entity.offset + entity.length)
        } else {
            continue
        }

        let uid: UniversalID | null = null
        for (const handler of Object.values(handlers)) {
            uid = handler.extractor(url)
            if (uid) break
        }
        if (!uid) break

        const allIDs = await resolveGlobal(uid)
        console.log(allIDs)
        const name = await resolveName(allIDs)
        if(!name) {
            // await ctx.reply()
            // TODO
            return
        }
    }
})