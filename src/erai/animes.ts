import { readFileSync, writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import { Anime } from "./anime";

export class Animes {
    private animes: Anime[]

    private constructor(data: Anime[]) {
        this.animes = data
    }

    static fromFile(path: string) {
        return new this(Anime.fromArray(JSON.parse(readFileSync(path, { encoding: 'utf-8' }))))
    }

    toFile(path: string) {
        writeFileSync(path, JSON.stringify(this.animes))
    }

    async toFileAsync(path: string) {
        await writeFile(path, JSON.stringify(this.animes))
    }

    async getSeries() {
        const series = await Promise.all(this.animes.map(anime => anime.checkSeries()))
        return series.flat()
    }

    // async add(url: string) {
    //     const anime = 
    // }
}