import { autoQuote } from '@roziscoding/grammy-autoquote'
import { Composer, InlineKeyboard } from 'grammy'
import { API } from 'shikimori'
import { HELP } from '../constants'
import * as mal from '../mal/api'
import { graphql } from '../gql/gql'
import { GraphQLClient } from 'graphql-request'

const findByMalId = graphql(`
  query ByMalId($idMal: Int) {
    Media(idMal: $idMal) {
      title {
        romaji
      }
      id
      idMal
      type
    }
  }
`)

const findById = graphql(`
  query ById($mediaId: Int) {
    Media(id: $mediaId) {
      title {
        romaji
      }
      id
      idMal
      type
    }
  }
`)

const shikimori = new API({
    baseURL: 'https://shikimori.one/api/',
    userAgent: 'Toku-bot',
    axios: {
        headers: { "Accept-Encoding": "gzip,deflate,compress" }
    }
})
const anilist = new GraphQLClient('https://graphql.anilist.co/')

export const autoMultiLink = new Composer().use(autoQuote)

type UniversalID = { type: keyof typeof handlers, id: number }

type Handler = {
    extractor: (url: string) => UniversalID | null
    resolve: (ids: AllIDs) => Promise<boolean>
    resolveName: (ids: AllIDs) => Promise<[string, string] | [string] | null>
    name: string
    link: (id: number) => string
}

type AllIDs = { [type: keyof typeof handlers]: number | null }

const handlers: { [key: string]: Handler } = {
    shikimori: {
        extractor(url) {
            const match = url.match(/shikimori.(?:me|one)\/animes\/.*?(\d+)/)
            if (!match) {
                return null
            }
            return { type: 'shikimori', id: parseInt(match[1]) }
        },

        async resolve(ids) {
            if (ids.shikimori && !ids.myanimelist) {
                ids.myanimelist = ids.shikimori
                return true
            }
            if (ids.myanimelist && !ids.shikimori) {
                ids.shikimori = ids.myanimelist
                return true
            }
            return false
        },

        async resolveName(ids) {
            if (!ids.shikimori) return null
            const res = await shikimori.animes.getById({
                id: ids.shikimori
            })
            if (res.russian) {
                return [res.russian, res.name]
            }
            return [res.name]
        },

        name: 'Shiki',
        link: (id) => `https://shikimori.one/animes/${id}`
    },
    myanimelist: {
        extractor(url) {
            const match = url.match(/myanimelist.net\/anime\/(\d+)/)
            if (!match) {
                return null
            }
            return { type: 'myanimelist', id: parseInt(match[1]) }
        },

        async resolve(ids) {
            return false
        },

        async resolveName(ids) {
            if (!ids.myanimelist) return null
            const res = await mal.get_anime_by_id(ids.myanimelist)
            if (res.title) {
                return [res.title]
            }
            return null
        },

        name: 'MAL',
        link: (id) => `https://myanimelist.net/anime/${id}`
    },
    anilist: {
        extractor(url) {
            const match = url.match(/anilist.co\/anime\/(\d+)/)
            if (!match) {
                return null
            }
            return { type: 'anilist', id: parseInt(match[1]) }
        },

        async resolve(ids) {
            if(ids.myanimelist && !ids.anilist) {
                const res = await anilist.request(findByMalId, {
                    idMal: ids.myanimelist
                })
                if(res.Media) {
                    ids.anilist = res.Media.id
                    return true
                }
            }

            if(ids.anilist && !ids.myanimelist) {
                const res = await anilist.request(findById, {
                    mediaId: ids.anilist
                })
                if(res.Media && res.Media.idMal) {
                    ids.myanimelist = res.Media.idMal
                    return true
                }
            }
            return false
        },

        async resolveName(ids) {
            if (!ids.anilist) return null
            const res = await anilist.request(findById, {
                mediaId: ids.anilist
            })
            if (res.Media?.title?.romaji) {
                return [res.Media.title.romaji]
            }
            return null
        },

        name: 'Anilist',
        link: (id) => `https://anilist.co/anime/${id}`
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

autoMultiLink.command('a', async ctx => {
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