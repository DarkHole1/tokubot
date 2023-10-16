import Parser from "rss-parser"
import { z } from "zod"
import { RSSItem } from "./new-rss"

const RawAnime = z.object({
    name: z.string(),
    russian: z.string().optional(),
    feedUrl: z.string().optional(),
    series: z.number().int()
})
type RawAnime = z.infer<typeof RawAnime>

export class Anime {
    private data: RawAnime
    private parser: Parser

    get name() {
        return this.data.name
    }

    set name(newName: string) {
        this.data.name = newName
    }

    get russian() {
        return this.data.russian
    }

    get series() {
        return this.data.series
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

    static async fromURL(url: string): Promise<Anime | null> {
        // TODO: Move code to separate method
        try {
            const parser = new Parser
            const feed = await parser.parseURL(url)
            const title = feed.title
            if (!title) return null
            const trueTitle = title.slice(0, -' - Erai-raws Torrent RSS'.length)
            const itemTitle = feed.items[0].title
            if (!itemTitle) return null

            const badgelessTitle = itemTitle.replace(/\[.*?\]/g, '').trim()
            const serie = parseInt(badgelessTitle.slice((trueTitle + ' - ').length))
            return new this({
                name: trueTitle,
                feedUrl: url,
                series: serie
            })
        } catch (e) {
            return null
        }
    }

    static fromName(name: string) {
        return new this({
            name, series: 0
        })
    }

    toJSON() {
        return this.data
    }

    async checkSeries() {
        const feedUrl = this.data.feedUrl
        if (!feedUrl) {
            return []
        }
        const feed = await this.parser.parseURL(feedUrl)
        const title = feed.items[0].title
        if (!title) return []

        const badgelessTitle = title.replace(/\[.*?\]/g, '').trim()
        const serie = parseInt(badgelessTitle.slice((this.name + ' - ').length))
        if (serie <= this.data.series) return []

        this.data.series = serie
        return [{ name: this.data.name, serie }]
    }

    handle(updates: RSSItem[]) {
        let completed = false
        let handled = []
        for (const update of updates) {
            if (update.anime != this.name) {
                continue
            }
            if (update.category == 'Finale') {
                completed = true
            }
            if (typeof update.episode != 'number' || update.episode <= this.series) {
                continue
            }
            this.data.series = update.episode as number
            handled.push({ anime: this.name, episode: this.series, russian: this.russian, completed })
        }
        return { completed, handled }
    }
}