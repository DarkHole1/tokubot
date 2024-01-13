import { z } from 'zod'

export const RawCache = z.object({
    name: z.object({
        is_event: z.boolean(),
        original: z.string()
    }),
    pic: z.object({
        is_event: z.boolean(),
        original: z.string()
    })
})
export type RawCache = z.infer<typeof RawCache>

export const defaultObject = (): RawCache => ({
    name: {
        is_event: false,
        original: ""
    },
    pic: {
        is_event: false,
        original: ""
    }
})
