import { outputFile } from "fs-extra";
import { AnimeKind, API } from "shikimori"

const shikimori = new API()

; void async function() {
    let animes = await shikimori.animes.get({
        season: 'summer_2023',
        order: 'name',
        limit: 50,
        kind: 'tv,ona' as AnimeKind
    })
    let page = 2
    while(true) {
        await sleep(20_000)
        const added = await shikimori.animes.get({
            season: 'summer_2023',
            order: 'name',
            limit: 50,
            kind: 'tv,ona' as AnimeKind,
            page
        })
        if(added.length == 0) break 
        page++
        animes = animes.concat(added)
    }

    const res = animes.map(anime => {
        return {
            name: anime.name,
            russian: anime.russian,
            url: anime.url,
            votes: []
        }
    })
    outputFile('data/votes.json', JSON.stringify(res))
}()

function sleep(time: number): Promise<never> {
    return new Promise((res, rej) => setTimeout(res, time))
}