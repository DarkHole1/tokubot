import { Bot, Context, GrammyError } from 'grammy'
import { hydrateReply, ParseModeFlavor } from '@grammyjs/parse-mode'
import { Config } from './config'
import { DARK_HOLE } from './constants'
import { sadAnimeWatcher } from './parts/sad-anime-watcher'
import debug from 'debug'
import { hydrateUserInfo, UserInfoFlavour } from './parts/user-info'

void (async () => {
    const log = debug('tokubot')
    const config = new Config()

    const bot = new Bot<UserInfoFlavour<ParseModeFlavor<Context>>>(config.TOKEN)
    bot.use(hydrateReply)
    bot.use(hydrateUserInfo())

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

    bot.use(sadAnimeWatcher(config, bot))
})().then(console.log, console.log)

