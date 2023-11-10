import { VK } from 'vk-io'
import { WallWallpostFull } from 'vk-io/lib/api/schemas/objects'

const watchGroupsDefaultArgs = {
    every: 5 * 60,
    wait: 0.1
}

export async function watchGroups(token: string, groupIds: number[], cb: (newPosts: WallWallpostFull[]) => void, config?: Partial<typeof watchGroupsDefaultArgs>) {
    const fullConfig = Object.assign({}, watchGroupsDefaultArgs, config)
    const vk = new VK({
        token
    })

    // Initialize
    const lastDates = new Array<number>(groupIds.length).fill(0)
    for (const [i, group] of groupIds.entries()) {
        const res = await vk.api.wall.get({
            owner_id: group,
            count: 1
        })
        if (res.items.length > 0 && res.items[0].date) {
            lastDates[i] = res.items[0].date
        }
        await sleep(fullConfig.wait * 1000)
    }

    // Check
    setInterval(async () => {
        try {
            let newPosts = [] as WallWallpostFull[]
            for (const [i, group] of groupIds.entries()) {
                const res = await vk.api.wall.get({
                    owner_id: group,
                    count: 10
                })
                newPosts = newPosts.concat(res.items.filter(post => post.date && post.date > lastDates[i]))
                if (res.items[0].date) {
                    lastDates[i] = res.items[0].date
                }
                sleep(fullConfig.wait)
            }
            if (newPosts.length > 0) {
                cb(newPosts)
            }
        } catch (e) {
            console.error('Error during parsing vk feed %o', e)
        }
    }, fullConfig.every * 1000)
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))