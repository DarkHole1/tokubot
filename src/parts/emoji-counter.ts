import { Composer } from "grammy"
import { EmojiCountersModel, UserCounter } from "../models/emoji-counter"
import { MessageReactionUpdated } from "grammy/types"
import debug from "debug"

const log = debug('tokubot:emoji-counter')

export async function emojiCounter() {
    const emojiCounter = new Composer
    let counter = await getOrDefault()

    emojiCounter.on('message_reaction', async (ctx, next) => {
        const actorId = ctx.messageReaction.actor_chat?.id ?? ctx.messageReaction.user?.id
        const actorName = getActorName(ctx.messageReaction)
        if (!actorName || !actorId) {
            return await next()
        }

        for (const reaction of ctx.messageReaction.new_reaction) {
            if (ctx.messageReaction.old_reaction.find(r => {
                if (reaction.type == 'custom_emoji') {
                    return r.type == 'custom_emoji' && r.custom_emoji_id == reaction.custom_emoji_id
                } else {
                    return r.type == 'emoji' && r.emoji == reaction.emoji
                }
            })) {
                continue
            }

            let emoji = reaction.type == 'custom_emoji' ? 'custom' : reaction.emoji
            counter.overall.set(emoji, (counter.overall.get(emoji) ?? 0) + 1)

            let userCounter = counter.byUser.get(actorId.toString())
            if (!userCounter) {
                userCounter = new UserCounter()
                userCounter.counters = new Map([[emoji, 1]])
                userCounter.name = actorName
                counter.byUser.set(actorId.toString(), userCounter)
            } else {
                userCounter.counters.set(emoji, (userCounter.counters.get(emoji) ?? 0) + 1)
                userCounter.name = actorName
            }
        }
        counter.save().catch((e) => log(e))
    })

    emojiCounter.command('emoji', async ctx => {
        const fromId = ctx.msg.sender_chat?.id ?? ctx.msg.from?.id
        if (!fromId) {
            return
        }

        const counter = await getCurrentCounter()
        if (!counter) {
            return
        }
        const userCounter = counter.byUser.get(fromId.toString())
        if (userCounter) {
            const total = Array.from(userCounter.counters.values()).reduce((a, b) => a + b)
            await ctx.reply(`За сегодня вы отправили ${total} реакций`, {
                reply_parameters: {
                    message_id: ctx.msg.message_id
                },
                reply_markup: {
                    inline_keyboard: [[{
                        text: 'Узнать какие',
                        url: 'https://t.me/tokutonarinotofficialbot/tokubot'
                    }]]
                }
            })
        } else {
            await ctx.reply('Вы ещё не ставили реакции сегодня', {
                reply_parameters: {
                    message_id: ctx.msg.message_id
                }
            })
        }
    })

    return {
        emojiCounter,
        reset: async () => {
            counter = await getOrDefault()
            await counter.save()
        }
    }
}

export function getYesterdayCounter() {
    const yesterday = new Date()
    yesterday.setHours(0, 0, 0, 0)
    yesterday.setDate(yesterday.getDate() - 1)
    return EmojiCountersModel.findOne({ day: yesterday })
}

export function getCurrentCounter() {
    return EmojiCountersModel.findOne({ day: new Date().setHours(0, 0, 0, 0) })
}

async function getOrDefault() {
    const res = await EmojiCountersModel.findOne({ day: new Date().setHours(0, 0, 0, 0) })
    if (res) {
        return res
    }
    return new EmojiCountersModel
}

function getActorName(messageReaction: MessageReactionUpdated): string | undefined {
    if (messageReaction.user) {
        const { first_name, last_name } = messageReaction.user
        if (last_name) {
            return `${first_name} ${last_name}`
        }
        return first_name
    }

    if (messageReaction.actor_chat) {
        const actor_chat = messageReaction.actor_chat
        if ('title' in actor_chat) {
            return actor_chat.title
        }

        if ('first_name' in actor_chat) {
            if ('last_name' in actor_chat) {
                return `${actor_chat.first_name} ${actor_chat.last_name}`
            }
            return actor_chat.first_name
        }
    }

    return undefined
}