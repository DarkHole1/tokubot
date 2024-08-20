import { InitDataParsed, parse, validate } from '@telegram-apps/init-data-node'

export type ValidateHelper = (data: string) => InitDataParsed | null

export const validateHelper = (token: string) => (data: string) => {
    try {
        const parsed = parse(data)
        validate(parsed, token)
        return parsed
    } catch (e) {
        return null
    }
}