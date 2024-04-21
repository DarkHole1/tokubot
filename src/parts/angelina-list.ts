// Heavy Object

import { Composer, Context } from "grammy"

type AngelinaEntry = {
    restricted: string[],
    id: number
}

export const angelinaList = (type: string[], list: AngelinaEntry[]) => {
    const typeSet = new Set(type)
    const actualIds = new Set(
        list
            .filter(
                entry => entry.restricted.some(e => typeSet.has(e))
            )
            .map(entry => entry.id)
    )

    return (ctx: Context) => {
        if (!ctx.from?.id) return true
        return !actualIds.has(ctx.from.id)
    }
}
