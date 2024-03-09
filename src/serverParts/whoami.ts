import { Router } from 'express'
import { tryAuthorize } from './authorize'
import { TokenDocument } from '../models/token'

export const whoami = Router()

whoami.get('/whoami', async (req, res) => {
    let token: TokenDocument | null = null
    if(req.query.token && typeof req.query.token == 'string') {
        token = await tryAuthorize(req.query.token)
    }

    res.json({
        success: true,
        data: token?.user ?? {
            id: 0,
            username: 'guest'
        }
    })
})