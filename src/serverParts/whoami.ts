import { Router } from 'express'

export const whoami = Router()

whoami.get('/whoami', (req, res) => {
    res.json({
        success: true,
        data: {
            id: 0,
            username: 'guest'
        }
    })
})