import * as dotenv from 'dotenv'
import { z } from 'zod'

const RawConfig = z.object({
    TOKEN: z.string().min(1),
    ERAI_TOKEN: z.string().min(1),
    SAGIRI_TOKEN: z.string().min(1),
    VK_SERVICE_KEY: z.string().min(1),
    MONGODB_URI: z.string().min(1)
})
type RawConfig = z.infer<typeof RawConfig>

export class Config implements RawConfig {
    TOKEN: string
    ERAI_TOKEN: string
    SAGIRI_TOKEN: string
    VK_SERVICE_KEY: string
    MONGODB_URI: string

    constructor() {
        const config = dotenv.config()
        if (!('parsed' in config) || !config.parsed) {
            throw new Error('No config found')
        }
        const parsed = RawConfig.parse(config.parsed)
        this.TOKEN = parsed.TOKEN
        this.ERAI_TOKEN = parsed.ERAI_TOKEN
        this.SAGIRI_TOKEN = parsed.SAGIRI_TOKEN
        this.VK_SERVICE_KEY = parsed.VK_SERVICE_KEY
        this.MONGODB_URI = parsed.MONGODB_URI
    }
}
