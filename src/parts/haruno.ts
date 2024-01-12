import { Composer } from 'grammy'
import { TOKU_CHAT } from '../constants'
import { guard, isPrivateChat, reply } from 'grammy-guard'
import { HarunoModel } from '../models/haruno'
import debug from 'debug'

const log = debug('app:parts:haruno')

async function findOrCreate(whoami: number) {
    const data = await HarunoModel.findOne({ whoami })
    if(data != null) {
        return data
    }

    return new HarunoModel({ whoami })
}

export const haruno = async () => {
    log('Starting module...')
    let list = await HarunoModel.find()
    log('List succesfully fetched, %d entries', list.length)
    const haruno = new Composer()

    haruno.filter(ctx => ctx.chat?.id == TOKU_CHAT).on('message:text', async (ctx, next) => {
        const text = ctx.msg.text.toLowerCase()
        for(const user of list) {
            for(const word of user.words) {
                if(text.includes(word)) {
                    try {
                        ctx.api.sendMessage(user.whoami, `В чате упомянули слово "${word}"`)
                    } catch(e) {
                        log('Error %o', e)
                    }
                    break
                }
            }
        }
        await next()
    })

    const privateGuard = guard(isPrivateChat, reply('Эта фича работает тока в личке'))
    haruno.command(
        'haruno',
        privateGuard,
        async ctx => {
            if(ctx.match.length == 0) {
                await ctx.reply('Укажи слово за которым ты хочешь смотреть после команды')
                return
            }
            const word = ctx.match.toLowerCase()
            const user = await findOrCreate(ctx.from!.id)
            if(user.words.includes(word)) {
                await ctx.reply('Слово уже есть в твоём списке')
                return
            }
            user.words.push(word)
            await user.save()
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