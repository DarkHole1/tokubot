import Parser from "rss-parser"

type Lang = 'us' | 'br' | 'mx' | 'es' | 'sa' | 'fr' | 'de' | 'it' | 'ru' | 'jp' | 'pt' | 'gb' | 'pl' | 'nl' | 'no' | 'fi' | 'tr' | 'se' | 'gr' | 'il' | 'ro' | 'id' | 'th' | 'kr' | 'dk' | 'cn' | 'bg' | 'vn' | 'in' | 'ua' | 'hu' | 'cz' | 'hr' | 'my' | 'sk' | 'ph'

type LinkConfig = {
    baseUrl: string,
    category: 'all' | 'airing' | 'batches' | 'movies/specials' | 'encodings' | 'raws',
    resolution: 'all' | '1080p' | '720p' | 'SD',
    linkType: 'all' | 'torrent' | 'magnet',
    subtitles: 'all' | Lang[],
    v0: boolean
}

const DEFAULT_CONFIG: LinkConfig = {
    baseUrl: 'https://www.erai-raws.info',
    category: 'all',
    resolution: 'all',
    linkType: 'all',
    subtitles: 'all',
    v0: true
}

// NOTE: This isn't safe againist bad url characters, but actually you shouldn't need it
export function makeLink(config?: Partial<LinkConfig> & { token: string }): string {
    const fullConfig = Object.assign({}, DEFAULT_CONFIG, config)
    let url = fullConfig.baseUrl
    switch (fullConfig.category) {
        case 'all':
            break
        case 'airing':
            url += '/episodes'
            break
        case 'batches':
            url += '/batches'
            break
        case 'movies/specials':
            url += '/specials'
            break
        case 'encodings':
            url += '/encodes'
            break
        case 'raws':
            url += '/raws'
            break
    }
    url += '/feed?'
    switch (fullConfig.resolution) {
        case 'all':
            break
        case '1080p':
            url += 'res=1080p&'
            break
        case '720p':
            url += 'res=720p&'
            break
        case 'SD':
            url += 'res=SD&'
            break
    }
    switch (fullConfig.linkType) {
        case 'all':
            break
        case 'magnet':
            url += 'type=magnet&'
            break
        case 'torrent':
            url += 'type=torrent&'
            break
    }
    if (fullConfig.subtitles != 'all') {
        url += fullConfig.subtitles.map(lang => 'subs[]=' + lang).join('&') + '&'
    }
    if (!fullConfig.v0) {
        url += 'v0=no&'
    }
    url += fullConfig.token
    return url
}

export type RSSItem = {
    title: string,
    linkType: string,
    size: string,
    infohash: string,
    subtitles: Lang[],
    category: string,
    anime: string,
    episode: number | [number, number] | 'SP',
    modifier: string | undefined,
    date: Date
}

const parser = new Parser({
    customFields: {
        item: ['erai:resolution', 'erai:linktype', 'erai:size', 'erai:infohash', 'erai:subtitles', 'erai:category']
    }
})

function parseEpisode(match: RegExpMatchArray) {
    if(match[2]) {
        return parseFloat(match[2])
    }
    if(match[3]) {
        return match[3].split(' ~ ').map(d => parseFloat(d)) as [number, number]
    }
    return 'SP' as const
}

export async function parseFeed(link: string): Promise<RSSItem[]> {
    const feed = await parser.parseURL(link)
    let items = feed.items.map(item => {
        if (!item.title) throw new Error('No title')
        const title = item.title.replace(/\[.+?\]/g, '').trim()
        const titleParsed = title.match(/^(.+) \- (?:(\d+(?:\.\d)?)|(\d+ ~ \d+)|(SP))(?:v\d+)?( END)?(?: \((.+)\))?$/)
        if (!titleParsed) throw new Error(`Cant parse title '${title}'. Feed is broken`)
        const anime = titleParsed[1]
        const episode = parseEpisode(titleParsed)
        const modifier = titleParsed[6]
        return {
            title,
            linkType: item['erai:linktype'],
            size: item['erai:size'],
            infohash: item['erai:infohash'],
            subtitles: Array.from((item['erai:subtitles'] as string).matchAll(/\[(.+?)\]/g)).map(match => match[1]) as Lang[],
            category: item['erai:category'].slice(1, -1),
            anime,
            episode,
            modifier,
            date: new Date(item.isoDate!)
        }
    })
    return items
}

type WatchUpdatesArgs = {
    every: number,
    initial: boolean
}

export async function watchUpdates(link: string, cb: (newItemts: RSSItem[]) => void, config?: Partial<WatchUpdatesArgs>) {
    const fullConfig: WatchUpdatesArgs = Object.assign({}, {
        every: 60, initial: false
    }, config)
    let lastDate = new Date()
    try {
        const items = await parseFeed(link)
        if(fullConfig.initial) cb(items)
        lastDate = items[0].date
    } catch(e) {
        console.error('Error during parsing erai-raws feed %o', e)
    }
    setInterval(async () => {
        try {
            const items = await parseFeed(link)
            const newItems = items.filter(item => item.date > lastDate)
            lastDate = items[0].date
            if(newItems.length > 0) cb(newItems)
        } catch(e) {
            console.error('Error during parsing erai-raws feed %o', e)
        }
    }, fullConfig.every * 1000)
}