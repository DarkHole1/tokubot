import { autoQuote } from '@roziscoding/grammy-autoquote'
import { Composer, InlineKeyboard } from 'grammy'
import { API } from 'shikimori'
import { HELP } from '../constants'
import * as mal from '../mal/api'

const shikimori = new API({
    baseURL: 'https://shikimori.one/api/',
    userAgent: 'Toku-bot',
    axios: {
        headers: { "Accept-Encoding": "gzip,deflate,compress" }
    }
})

export const autoMultiLink = new Composer().use(autoQuote)

type UniversalID = { type: keyof typeof handlers, id: string }

type Handler = {
    extractor: (url: string) => UniversalID | null
    resolve: (ids: AllIDs) => Promise<boolean>
    resolveName: (ids: AllIDs) => Promise<[string, string] | [string] | null>
    name: string
    link: (id: string) => string
}

type AllIDs = { [type: keyof typeof handlers]: string | null }

const handlers: { [key: string]: Handler } = {
    shikimori: {
        extractor(url) {
            const match = url.match(/shikimori.(?:me|one)\/animes\/.*?(\d+)/)
            if (!match) {
                return null
            }
            return { type: 'shikimori', id: match[1] }
        },

        async resolve(ids) {
            if(ids.shikimori && !ids.myanimelist) {
                ids.myanimelist = ids.shikimori
                return true
            }
            if(ids.myanimelist && !ids.shikimori) {
                ids.shikimori = ids.myanimelist
                return true
            }
            return false
        },

        async resolveName(ids) {
            if (!ids.shikimori) return null
            const res = await shikimori.animes.getById({
                id: parseInt(ids.shikimori)
            })
            if (res.russian) {
                return [res.russian, res.name]
            }
            return [res.name]
        },

        name: 'Shiki',
        link: (id) => `https://shikimori.me/animes/${id}`
    },
    myanimelist: {
        extractor(url) {
            const match = url.match(/myanimelist.net\/anime\/(\d+)/)
            if (!match) {
                return null
            }
            return { type: 'myanimelist', id: match[1] }
        },

        async resolve(ids) {
            return false
        },

        async resolveName(ids) {
            if (!ids.myanimelist) return null
            const res = await mal.get_anime_by_id(parseInt(ids.myanimelist))
            if(res.title) {
                return [res.title]
            }
            return null
        },

        name: 'MAL',
        link: (id) => `https://myanimelist.net/anime/${id}`
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

async function resolveName(ids: AllIDs): Promise<[string, string] | [string] | null> {
    for (const handler of Object.values(handlers)) {
        const res = handler.resolveName(ids)
        if (res) return res
    }
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
        if (!name) {
            await ctx.replyWithSticker(HELP)
            return
        }
        const buttons = new InlineKeyboard([
            Object.entries(allIDs).filter(([_, value]) => !!value).map(([name, value]) => ({
                text: handlers[name].name,
                url: handlers[name].link(value!)
            }))
        ])
        await ctx.reply(name.join(' / '), {
            reply_markup: buttons
        })
    }
})