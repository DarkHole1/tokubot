import { Request, Response, Router } from 'express'
import { Authorized, authorize } from './authorize'
import { z } from 'zod'
import { EverydayPostModel } from '../models/everyday-post'

export const ryo = Router()

type Callback = (req: Request, res: Response) => unknown | Promise<unknown>
const ifCanPost = (cb: Callback) => {
    return authorize((user, req, res) => {
        if(!user.allowPost) {
            return res.json({
                success: false,
                error: {
                    text: 'Access denied'
                }
            })
        }
        return cb(req, res)
    })
}

const TAGS = [
    'world trigger',
    'monogatari'
] as const

ryo.get('/ryo/tags', (req, res) => {
    return res.json({
        success: true,
        data: TAGS
    })
})

const Options = z.object({
    url: z.string(),
    tag: z.enum(TAGS)
})

ryo.post('/ryo', ifCanPost(async (req, res) => {
    const result = Options.safeParse(req.query)
    if(!result.success) {
        return res.json({
            success: true,
            error: {
                text: 'One of parameters missing or invalid'
            }
        })
    }

    const post = new EverydayPostModel({
        type: result.data.tag,
        fileId: result.data.url
    })

    try {
        await post.save()
    
        return res.json({
            success: true,
            data: null
        })
    } catch(e) {
        return res.json({
            success: false,
            error: {
                text: 'Error adding new post'
            }
        })
    }
}))