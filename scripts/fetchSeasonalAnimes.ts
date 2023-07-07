import { outputFile } from "fs-extra"
import { AnimeKind, API } from "shikimori"

const shikimori = new API({
    axios: {
        headers: {
            'Accept-Encoding': '*'
        }
    }
})

void async function () {
    let animes = await shikimori.animes.get({
        season: 'spring_2023',
        order: 'name',
        limit: 50,
        kind: 'tv'
    })
    let page = 2
    while (true) {
        await sleep(20_000)
        const added = await shikimori.animes.get({
            season: 'summer_2023',
            order: 'name',
            limit: 50,
            kind: 'tv' as AnimeKind,
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
            votes: {}
        }
    })
    outputFile('data/votes2.json', JSON.stringify(res))
}()

function sleep(time: number): Promise<never> {
    return new Promise((res, rej) => setTimeout(res, time))
}