import * as dotenv from 'dotenv'
import { z } from 'zod'

const RawConfig = z.object({
    TOKEN: z.string().min(1)
})
type RawConfig = z.infer<typeof RawConfig>

export class Config implements RawConfig {
    TOKEN: string

    constructor() {
        const config = dotenv.config()
        if(!('parsed' in config) || !config.parsed) {
            throw new Error('No config found')
        }
        const parsed = RawConfig.parse(config.parsed)
        this.TOKEN = parsed.TOKEN
    }
}
