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

    return {
        emojiCounter,
        reset: async () => {
            counter = new EmojiCountersModel
            await counter.save()
        }
    }
}

async function getOrDefault() {
    const res = await EmojiCountersModel.findOne()
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