import { z } from "zod"

export const RawBRS = z.object({
    days: z.number().int(),
    queue: z.array(z.string())
})
export type RawBRS = z.infer<typeof RawBRS>

