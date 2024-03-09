import express from 'express'
import { whoami } from './serverParts/whoami'

export const server = express()

server.use('/api', whoami)

