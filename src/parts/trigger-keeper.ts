import { Composer, Context } from 'grammy'
import { choice } from '../utils'

export type Trigger = ({
    type: 'string',
    string: string
} | {
    type: 'regex',
    regex: string,
    global?: boolean,
    multiline?: boolean,
    ignoreCase?: boolean,
    unicode?: boolean,
    wholeWord?: boolean
}) & {
    debounce?: number,
    action: {
        type: 'reply' | 'preciseReply' | 'message'
    } & ({
        text: string | string[]
    } | {
        sticker: string | string[]
    } | {
        photo: string | string[],
        caption?: string
    } | {
        video: string | string[],
        caption?: string
    } | {
        gif: string | string[],
        caption?: string
    } | {
        voice: string | string[]
    } | {
        audio: string | string[],
        caption?: string
    })
}

export const triggerKeeper = (triggers: Trigger[]) => {
    const triggerKeeper = new Composer

    for (const trigger of triggers) {
        let convertedTrigger: string | RegExp
        if (trigger.type == 'regex') {
            let flags = ''
            if (trigger.multiline) {
                flags += 'm'
            }
            if (trigger.ignoreCase) {
                flags += 'i'
            }
            if (trigger.global) {
                flags += 'g'
            }
            if (trigger.wholeWord || trigger.unicode) {
                flags += 'u'
            }

            if (trigger.wholeWord) {
                convertedTrigger = new RegExp(`(\\P{L}|^)${trigger.regex}(\\P{L}|$)`, flags)
            } else {
                convertedTrigger = new RegExp(trigger.regex, flags)
            }
        } else if (trigger.type == 'string') {
            convertedTrigger = trigger.string
        } else {
            continue
        }

        const singleOrRandom: <T>(t: T | T[]) => () => T = (t) => Array.isArray(t) ? (() => choice(t)) : (() => t)
        let convertedAction: (ctx: Context) => Promise<unknown>

        const action = trigger.action
        let params: (ctx: Context) => object
        if (action.type == 'message') {
            params = () => ({})
        } else if (action.type == 'reply') {
            params = ctx => ({
                reply_parameters: ctx.message ? {
                    message_id: ctx.message.message_id
                } : undefined
            })
        } else if (action.type == 'preciseReply') {
            params = ctx => {
                if (!ctx.match) return {}

                let quote: string | undefined
                let offset: number | undefined

                if (typeof ctx.match == 'string') {
                    quote = ctx.match
                    offset = (ctx.msg?.text ?? ctx.msg?.caption)?.indexOf(quote)
                } else {
                    quote = ctx.match[0]
                    offset = ctx.match.index
                }
                return {
                    reply_parameters: ctx.message ? {
                        message_id: ctx.message.message_id,
                        quote,
                        quote_position: offset
                    } : undefined
                }
            }
        } else {
            continue
        }

        if ('text' in action) {
            const text = singleOrRandom(action.text)
            convertedAction = ctx => ctx.reply(text(), params(ctx))
        } else if ('sticker' in action) {
            const sticker = singleOrRandom(action.sticker)
            convertedAction = ctx => ctx.replyWithSticker(sticker(), params(ctx))
        } else if ('photo' in action) {
            const photo = singleOrRandom(action.photo)
            convertedAction = ctx => ctx.replyWithPhoto(photo(), {
                caption: action.caption,
                ...params(ctx)
            })
        } else if ('video' in action) {
            const video = singleOrRandom(action.video)
            convertedAction = ctx => ctx.replyWithVideo(video(), {
                caption: action.caption,
                ...params(ctx)
            })
        } else if ('gif' in action) {
            const gif = singleOrRandom(action.gif)
            convertedAction = ctx => ctx.replyWithAnimation(gif(), {
                caption: action.caption,
                ...params(ctx)
            })
        } else if ('audio' in action) {
            const audio = singleOrRandom(action.audio)
            convertedAction = ctx => ctx.replyWithAudio(audio(), {
                caption: action.caption,
                ...params(ctx)
            })
        } else if ('voice' in action) {
            const voice = singleOrRandom(action.voice)
            convertedAction = ctx => ctx.replyWithVoice(voice(), params(ctx))
        } else {
            continue
        }

        if (trigger.debounce) {
            let lastTime = 0
            const debounce = trigger.debounce
            const trueConvertedAction = convertedAction
            convertedAction = async ctx => {
                const now = Date.now()
                if (now - lastTime < debounce) {
                    return
                }
                lastTime = Date.now()
                return await trueConvertedAction(ctx)
            }
        }

        triggerKeeper.hears(convertedTrigger, convertedAction)
    }
    return triggerKeeper
}
