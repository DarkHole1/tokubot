import { Composer } from 'grammy'
import { TOKU_CHAT } from '../constants'
import { guard, isPrivateChat, reply } from 'grammy-guard'
import { HarunoModel } from '../models/haruno'
import debug from 'debug'

const log = debug('app:parts:haruno')

export const haruno = async () => {
    log('Starting module...')
    let list = await HarunoModel.find()
    log('List succesfully fetched, %d entries', list.length)
    const haruno = new Composer()

    haruno.filter(ctx => ctx.chat?.id == TOKU_CHAT).on('message:text', async (ctx, next) => {
        // TODO
        await next()
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

    return haruno
}