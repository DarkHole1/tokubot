import { readFileSync, writeFileSync } from "fs";
import { outputFile, outputFileSync, writeFile } from "fs-extra";
import { Anime } from "./anime";

export class Animes {
    private animes: Anime[]

    private constructor(data: Anime[]) {
        this.animes = data
    }

    static fromFile(path: string) {
        return new this(Anime.fromArray(JSON.parse(readFileSync(path, { encoding: 'utf-8' }))))
    }

    static fromFileSafe(path: string) {
        try {
            return this.fromFile(path)
        } catch(_) {
            return new this([])
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

    add(anime: Anime) {
        this.animes.push(anime)
    }

    list() {
        return this.animes.slice()
    }
}