import { Composer } from 'grammy'
import { Cache } from '../models/cache'

export const events = (cache: Cache) => {
    const events = new Composer

    events.callbackQuery(/approve:.+/, async ctx => {
        // TODO
    })

    events.callbackQuery(/decline:.+/, async ctx => {
        // TODO
    })

    events.command('row', async ctx => {
        // TODO
    })

    events.command('full', async ctx => {
        // TODO
    })

    // TODO
}