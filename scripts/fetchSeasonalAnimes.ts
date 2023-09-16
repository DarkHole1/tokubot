import { outputFile } from "fs-extra"
import { AnimeKind, API } from "shikimori"

const shikimori = new API({
    axios: {
        headers: {
            'Accept-Encoding': '*'
        }
    }
})

const SEASON = 'fall_2023'
const VOTES_FILE = 'data/votes3.json'
const KINDS = 'tv,ona,ova' as AnimeKind

void async function () {
    let animes = await shikimori.animes.get({
        season: SEASON,
        order: 'name',
        limit: 50,
        kind: KINDS
    })
    let page = 2
    while (true) {
        await sleep(20_000)
        const added = await shikimori.animes.get({
            season: SEASON,
            order: 'name',
            limit: 50,
            kind: KINDS,
            page
        })
        if (added.length == 0) break
        console.log(`Fetched ${page} pages`)
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
    outputFile(VOTES_FILE, JSON.stringify(res))
}()

function sleep(time: number): Promise<never> {
    return new Promise((res, rej) => setTimeout(res, time))
}