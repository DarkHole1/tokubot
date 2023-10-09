import { readFileSync } from 'fs-extra'
import mongoose from 'mongoose'
import { Config } from '../src/config'
import { RawBRS } from '../src/models/brs'
import { CountersModel } from '../src/models/counters'
import { EverydayPostModel } from '../src/models/everyday-post'
import { debug } from 'debug'

const log = debug('script:wt2mongo')

log('Loading config & wt file')
const config = new Config()
const wtFile = RawBRS.parse(JSON.parse(readFileSync('data/world-trigger.json', { encoding: 'utf-8' })))
log('Loaded')

void (async () => {
    log('Starting connecting to mongo...')
    await mongoose.connect(config.MONGODB_URI)
    log('Connected to mongodb')

    const counters = await CountersModel.findOne()
    if (!counters) {
        log('Counter not found')
        await CountersModel.create({ worldTriggerDays: wtFile.days })
    } else {
        log('Counter found, changing...')
        counters.worldTriggerDays = wtFile.days
        await counters.save()
        log('Counter changed')
    }

    log('Starting converting %d file ids to posts in mongo', wtFile.queue.length)
    for (const [i, fileId] of wtFile.queue.entries()) {
        log('Converting %d post...', i + 1)
        const post = new EverydayPostModel({
            type: 'world trigger',
            fileId
        })
        await post.save()
        log('Converted!')
    }

    await mongoose.disconnect()
})().catch(console.log)