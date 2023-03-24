import * as dotenv from 'dotenv'
import { z } from 'zod'

const Config = z.object({
    TOKEN: z.string()
})
type Config = z.infer<typeof Config>

export function loadConfig() {
    const config = dotenv.config()
    if(!('parsed' in config) || !config.parsed) {
        throw new Error('No config found')
    }
    return Config.parse(config.parsed)
}
