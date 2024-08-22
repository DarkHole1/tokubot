import { Router } from "express"
import { StatsEntryModel } from "../models/stats"
import { subMonths, subWeeks } from "date-fns"

export const stats = Router()

stats.get('/stats/:timerange', async (req, res, next) => {
    const timerange = req.params.timerange
    if (!['weekly', 'monthly'].includes(timerange)) {
        return next()
    }
    const telegramID = Number(req.query.id)
    if (!isFinite(telegramID)) {
        return res.json([])
    }

    const since = timerange == 'weekly' ? subWeeks(new Date(), 1) : subMonths(new Date(), 1)

    const stats = await StatsEntryModel.find({
        telegramID,
        date: {
            $gte: since
        }
    })

    return res.json(stats.map(({ plannedMinutes, watchedMinutes, date }) => ({ plannedMinutes, watchedMinutes, date })))
})