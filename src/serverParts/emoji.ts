import { Router } from "express"
import { getCurrentCounter } from "../parts/emoji-counter"

export const emoji = Router()

emoji.get('/emoji', async (req, res) => {
    if (typeof req.query.id != 'string') {
        return res.json({})
    }

    const id = Number(req.query.id)
    if (!isFinite(id)) {
        return res.json({})
    }

    const counter = await getCurrentCounter()

    if (!counter) {
        return res.json({})
    }

    const user = counter.byUser.get(id.toString())

    return res.json(user?.counters ?? {})
})