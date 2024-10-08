import express from 'express'
import { whoami } from './serverParts/whoami'
import { ryo } from './serverParts/ryo'
import { emoji } from './serverParts/emoji'
import { linksManager } from './serverParts/links-manager'
import { ValidateHelper } from './serverParts/validate-helper'
import { stats } from './serverParts/stats'

export const server = (validate: ValidateHelper) => {
    const server = express()

    server.use('/api', whoami)
    server.use('/api', ryo)
    server.use('/api', emoji)
    server.use('/api', linksManager(validate))
    server.use('/api', stats)

    return server
}
