import { Bot, Context, GrammyError } from 'grammy'
import * as statics from './static'
import { hydrateReply, ParseModeFlavor } from '@grammyjs/parse-mode'
import { Config } from './config'
import { TOKU_CHAT, ANGELINA_LIST, DARK_HOLE } from './constants'
import { fun } from './parts/fun'
import { brs } from './parts/brs'
import { backArrow } from './parts/backarrow'
import { solidScript } from './parts/solid-scritpt'
import { service } from './parts/service'
import { worldTrigger } from './parts/world-trigger'
import { autoMultiLink } from './parts/auto-multi-link'
import { watchGroups } from './vk/watcher'
import mongoose from 'mongoose'
import { thanks } from './parts/thanks'
import { sadAnimeWatcher } from './parts/sad-anime-watcher'
import { voting2 } from './parts/voting2'
import { isAdmin } from 'grammy-guard'
import { blessing } from './parts/blessing'
import { unspoil } from './parts/unspoil'
import { haruno } from './parts/haruno'
import { events } from './parts/events'
import { Cache } from './models/cache'
import { allFiction } from './all-fiction'
import { recommendations } from './parts/recommendations'
import { server } from './server'
import debug from 'debug'
import { everydayPost } from './parts/everyday-post'

void (async () => {
    const log = debug('tokubot')
    const config = new Config()
    const cache = await Cache.load('./data/cache.json')

    await mongoose.connect(config.MONGODB_URI)

    const bot = new Bot<ParseModeFlavor<Context>>(config.TOKEN)
    bot.use(hydrateReply)

    const help = statics.help

    bot.catch(async err => {
        console.error(err.error)
        try {
            const e = err.error
            if (e instanceof GrammyError) {
                await bot.api.sendMessage(DARK_HOLE, `An error occured:\n${e.description}`)
            }
        } catch (e) {
            console.log(`Send failed`)
        }
    })

    bot.command('stop').filter(isAdmin, _ => bot.stop())

    bot.command('start', (ctx) =>
        ctx.replyFmt(help, {
            reply_to_message_id: ctx.msg.message_id
        })
    )

    bot.use(allFiction(bot.api))

    bot.use(recommendations)
    bot.use(await haruno())
    bot.use(service)
    bot.use(voting2)
    bot.use(backArrow(config))
    bot.use(solidScript)
    bot.use(autoMultiLink)

    bot.use(events(cache, bot as any, config))

    brs(bot)
    worldTrigger(bot)
    everydayPost(bot)

    bot.filter(ctx => !ANGELINA_LIST.includes(ctx.from?.id ?? 0)).use(fun)
    bot.use(unspoil)
    bot.use(blessing)
    bot.use(thanks)
    bot.use(sadAnimeWatcher(config, bot))

    watchGroups(config.VK_SERVICE_KEY, [-199157142], async (posts) => {
        for (const post of posts) {
            await bot.api.sendMessage(TOKU_CHAT, `https://vk.com/wall${post.owner_id}_${post.id}`)
        }
    })

    server.listen(9000, () => {
        log('Server listening on http://localhost:9000/');
    })
    bot.start()
})().then(console.log, console.log)

