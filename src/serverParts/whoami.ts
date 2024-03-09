import { Router } from 'express'
import { tryAuthorize } from './authorize'
import { TokenDocument } from '../models/token'

export const whoami = Router()

whoami.get('/whoami', async (req, res) => {
    let token: TokenDocument | null = null
    if(req.query.token && typeof req.query.token == 'string') {
        token = await tryAuthorize(req.query.token)
    }

    const data = {
        id: 0,
        username: 'guest'
    }

    if(token) {
        Object.assign(data, Object.fromEntries(Object.entries(token.toObject().user).filter(n => ['id', 'username'].includes(n[0]))))
    }

    res.json({
        success: true,
        data
    })
})