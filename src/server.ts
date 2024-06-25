import express from 'express'
import { whoami } from './serverParts/whoami'
import { ryo } from './serverParts/ryo'
import { emoji } from './serverParts/emoji'

export const server = express()

server.use('/api', whoami)
server.use('/api', ryo)
server.use('/api', emoji)
