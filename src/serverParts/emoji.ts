import { Router } from "express"
import { getCurrentCounter } from "../parts/emoji-counter"

export const emoji = Router()

emoji.get('/emoji/rating', async (_req, res) => {
    const counter = await getCurrentCounter()

    if (!counter) {
        return res.json([])
    }

    const sum = (a: Iterable<number>) => Array.from(a).reduce((a, b) => a + b)

    const countByUser = Array.from(counter.byUser.values()).map((counter) => ({
        name: counter.name, 
        count: sum(counter.counters.values())
    }))

    return res.json(countByUser.sort((a, b) => b.count - a.count))
})

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