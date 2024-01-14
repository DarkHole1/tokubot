import { readFile, writeFile } from 'fs/promises'
import { z } from 'zod'

export const RawCache = z.object({
    name: z.object({
        is_event: z.boolean(),
        original: z.string()
    }),
    pic: z.object({
        is_event: z.boolean(),
        original: z.string()
    })
})
export type RawCache = z.infer<typeof RawCache>

export const defaultObject = (): RawCache => ({
    name: {
        is_event: false,
        original: ""
    },
    pic: {
        is_event: false,
        original: ""
    }
})

export class Cache implements RawCache {
    private data : RawCache
    private filename : string

    private constructor(data: RawCache, filename: string) {
        this.data = data
        this.filename = filename
    }

    get name() {
        return Object.assign({}, this.data.name)
    }

    get pic() {
        return Object.assign({}, this.data.pic)
    }
    
    static empty(filename: string) {
        return new this({
            name: {
                is_event: false,
                original: ""
            },
            pic: {
                is_event: false,
                original: ""
            }
        }, filename)
    } 

    static async load(filename: string) {
        try {
            const text = await readFile(filename, { encoding: 'utf-8' })
            const json = JSON.parse(text) as unknown
            const parsed = RawCache.parse(json)
            return new this(parsed, filename)
        } catch(e) {
            return this.empty(filename)
        }
    }

    async save(filename?: string) {
        const realFilename = filename ?? this.filename
        const json = JSON.stringify(this.data)
        await writeFile(realFilename, json)
    }

    startNameEvent(original: string) {
        this.data.name = {
            is_event: true,
            original
        }
    }

    setOriginalPic(original: string) {
        this.data.pic.original = original
    }

    startPicEvent() {
        this.data.pic.is_event = true
    }

    stopNameEvent() {
        this.data.name.is_event = false;
    }
    
    stopPicEvent() {
        this.data.pic.is_event = false;
    }
}