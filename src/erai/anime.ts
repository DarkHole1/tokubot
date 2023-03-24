import { readFileSync } from "fs";
import Parser from "rss-parser";
import { z } from "zod";

const RawAnime = z.object({
    name: z.string(),
    feedUrl: z.string(),
    series: z.number().int()
})
type RawAnime = z.infer<typeof RawAnime>

export class Anime {
    private data: RawAnime
    private parser: Parser

    get name() {
        return this.data.name
    }

    private constructor(data: RawAnime) {
        this.data = data
        this.parser = new Parser
    }

    static from(data: unknown) {
        return new this(RawAnime.parse(data))
    }

    static fromArray(data: unknown) {
        return z.array(RawAnime).parse(data).map(anime => new this(anime))
    }

    toJSON() {
        return this.data
    }

    async checkSeries() {
        const feed = await this.parser.parseURL(this.data.feedUrl)
        const title = feed.items[0].title
        if(!title) return []

        const badgelessTitle = title.replace(/\[.*?\]/g, '').trim()
        const serie = parseInt(badgelessTitle.slice((this.name + ' - ').length))
        if(serie <= this.data.series) return []
        
        this.data.series = serie
        return [{name: this.data.name, serie }]
    }
}