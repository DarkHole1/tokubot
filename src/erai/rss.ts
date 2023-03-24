import Parser from "rss-parser";

export class RSS {
    private date: number
    private feed: string
    private parser: Parser

    constructor(feed: string) {
        this.date = Date.now()
        this.feed = feed
        this.parser = new Parser({
            customFields: {
                item: ['erai:resolution', 'erai:linktype', 'erai:size', 'erai:infohash', 'erai:subtitles', 'erai:category']
            }
        })
    }

    async getNewUpdates() {
        let feed = await this.parser.parseURL(this.feed)
        const lastDate = this.date
        this.date = Date.now()
        const newItems = feed.items.filter(item => item.isoDate && new Date(item.isoDate).getTime() >= lastDate)
        const newItemsWithName = newItems.map(item => ({ name: item.title?.replace(/\[[^\]]*?\]/g, '')?.trim(), ...item }))
        return newItemsWithName
    }
}

(async () => {
    const rss = new RSS('https://www.erai-raws.info/feed/?type=torrent&0879fd62733b8db8535eb1be24e23f6d')
    const items = await rss.getNewUpdates()
    console.log(items)
})()