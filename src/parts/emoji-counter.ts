import { Composer } from "grammy"
import { EmojiCountersModel } from "../models/emoji-counter"
import { MessageReactionUpdated } from "grammy/types"

export async function emojiCounter() {
    const emojiCounter = new Composer
    let counter = await getOrDefault()

    emojiCounter.on('message_reaction', async (ctx, next) => {
        const actor = getActorName(ctx.messageReaction)
        if (!actor) {
            return await next()
        }

        for (const reaction of ctx.messageReaction.new_reaction) {
            let emoji = reaction.type == 'custom_emoji' ? 'custom' : reaction.emoji
            counter.overall.set(emoji, (counter.overall.get(emoji) ?? 0) + 1)

            let userMap = counter.byUser.get(actor)
            if (!userMap) {
                userMap = new Map
                counter.byUser.set(actor, userMap)
            }
            userMap.set(emoji, (userMap.get(emoji) ?? 0) + 1)
        }

        counter.save().catch((e) => console.log(e))
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