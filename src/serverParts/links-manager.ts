import { json, Router } from "express"
import { ValidateHelper } from "./validate-helper"
import { z } from "zod"
import { ProfileModel } from "../models/profile"

const Body = z.object({
    initData: z.string(),
    username: z.string(),
    type: z.enum(["shikimori", "anilist", "myanimelist"])
})
type Body = z.infer<typeof Body>

export const linksManager = (validate: ValidateHelper) => {
    const linksManager = Router()

    linksManager.get('/links', async (req, res) => {
        const telegramID = Number(req.query.id)
        if (!isFinite(telegramID)) {
            return res.json(null)
        }

        const profile = await ProfileModel.findOne({ telegramID })
        if (!profile) {
            return res.json(null)
        }

        return res.json({
            shikimori: profile.shikimoriUsername,
            anilist: profile.anilistUsername,
            myanimelist: profile.myanimelistUsernme
        })
    })

    linksManager.post('/links', json(), async (req, res) => {
        const parsedBody = Body.safeParse(req.body)
        if (!parsedBody.success) {
            return res.json({ success: false })
        }

        const validatedInitData = validate(parsedBody.data.initData)
        if (!validatedInitData || !validatedInitData.user) {
            return res.json({ success: false })
        }

        const profile = await ProfileModel.findOne({
            telegramID: validatedInitData.user.id
        })
        if (!profile) {
            return res.json(null)
        }

        if (parsedBody.data.type == "shikimori") {
            profile.shikimoriUsername = parsedBody.data.username
        } else if (parsedBody.data.type == "anilist") {
            profile.anilistUsername = parsedBody.data.username
        } else if (parsedBody.data.type == "myanimelist") {
            profile.myanimelistUsernme = parsedBody.data.username
        }
        return res.json({ success: true })
    })

    return linksManager
}