// Heavy Object

import { Composer } from "grammy"

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

    return new Composer().filter(ctx => {
        if (!ctx.from?.id) return true
        return !actualIds.has(ctx.from.id)
    })
}
