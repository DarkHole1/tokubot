import { readFileSync, writeFileSync } from "fs"
import { outputFile, outputFileSync, writeFile } from "fs-extra"
import { Anime } from "./anime"
import { makeLink, watchUpdates } from "./new-rss"
import debug from 'debug'

const log = debug("tokubot:animes")

export class Animes {
    private animes: Anime[]
    private token: string

    private constructor(data: Anime[], token: string) {
        this.animes = data
        this.token = token
    }

    static fromFile(path: string, token: string) {
        return new this(Anime.fromArray(JSON.parse(readFileSync(path, { encoding: 'utf-8' }))), token)
    }

    static fromFileSafe(path: string, token: string) {
        try {
            log('Loading animes from file %s', path)
            return this.fromFile(path, token)
        } catch (e) {
            log('An error occured during loading file, falling back to empty list: %o', e)
            return new this([], token)
        }
    }

    toFile(path: string) {
        outputFileSync(path, JSON.stringify(this.animes))
    }

    async toFileAsync(path: string) {
        await outputFile(path, JSON.stringify(this.animes))
    }

    async getSeries() {
        const series = await Promise.all(this.animes.map(anime => anime.checkSeries()))
        return series.flat()
    }

    rename(id: number, newName: string) {
        const anime = this.animes[id]
        if (!anime) {
            return
        }
        anime.name = newName
    }

    delete(id: number) {
        if (id < 0 || id >= this.animes.length) {
            return
        }
        this.animes.splice(id, 1)
    }

    add(anime: Anime) {
        this.animes.push(anime)
    }

    list() {
        return this.animes.slice()
    }

    start(update: (animes: ({ anime: string, russian?: string, episode: number, completed: boolean })[]) => void, err?: (e: unknown) => void) {
        watchUpdates(makeLink({
            category: 'airing',
            linkType: 'magnet',
            token: this.token
        }), updates => {
            log("Starting processing updates, got %d updates", updates.length)
            let res = [] as ({ anime: string, episode: number, completed: boolean }[])
            this.animes = this.animes.filter(anime => {
                const { completed, handled } = anime.handle(updates)
                res = res.concat(handled)
                return !completed
            })
            if (res.length != 0) update(res)
        }, {
            initial: true,
            every: 90
        }, err)
    }
}