import { Request, Response } from 'express'
import { TokenDocument, TokenModel } from '../models/token'

export type Authorized = (user: TokenDocument['user'], req: Request, res: Response) => unknown | Promise<unknown>
export function authorize(f: Authorized) {
    return async (req: Request, res: Response) => {
        if (!req.query.token || typeof req.query.token != 'string') {
            return res.json({
                success: false,
                error: {
                    text: 'Unathorized'
                }
            })
        }

        const token = await tryAuthorize(req.query.token)

        if (!token) {
            return res.json({
                success: false,
                error: {
                    text: 'Unathorized'
                }
            })
        }

        return f(token.user, req, res)
    }
}

export async function tryAuthorize(token: string) {
    return await TokenModel.findOne({ token })
}