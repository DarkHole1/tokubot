import { Composer } from 'grammy'
import { TOKU_CHAT } from '../constants'
import { guard, isPrivateChat, reply } from 'grammy-guard'

export const haruno = new Composer()

haruno.filter(ctx => ctx.chat?.id == TOKU_CHAT).on('message:text', async ctx => {

})

const privateGuard = guard(isPrivateChat, reply('Эта фича работает тока в личке'))
haruno.command(
    'haruno',
    privateGuard,
    async ctx => {
        // TODO
    }
)

haruno.command(
    'hayato',
    privateGuard,
    async ctx => {
        // TODO
    }
)

haruno.command(
    'yukino',
    privateGuard,
    async ctx => {
        // TODO
    }
)