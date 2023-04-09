import { readFileSync, writeFileSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { z } from "zod";
import { Anime } from "./erai/anime";
import { ItemWithListStatus } from "./mal/types/animelist";
import { choice } from "./utils";

const RawRecommendation = z.number()
type RawRecommendation = z.infer<typeof RawRecommendation>

export class Recommendation {
    private id: number

    private constructor(rec: RawRecommendation) {
        this.id = rec
    }

    static from(data: unknown) {
        return new this(RawRecommendation.parse(data))
    }

    static fromArray(data: unknown) {
        return z.array(RawRecommendation).parse(data).map(rec => new this(rec))
    }

    static fromId(id: number) {
        return new this(id)
    }

    toJSON() {
        return this.id
    }

    resolve(all_animes: ItemWithListStatus[]) {
        return all_animes.find(anime => anime.node.id == this.id)
    }
}

export class Recommendations {
    private recs: Recommendation[]

    private constructor(data: Recommendation[]) {
        this.recs = data
    }

    static fromFileSync(filename: string) {
        const contents = readFileSync(filename, { encoding: 'utf-8' })
        const parsed = JSON.parse(contents)
        return new this(Recommendation.fromArray(parsed))
    }

    static async fromFile(filename: string) {
        const contents = await readFile(filename, { encoding: 'utf-8' })
        const parsed = JSON.parse(contents)
        return new this(Recommendation.fromArray(parsed))
    }

    toFileSync(filename: string) {
        const contents = JSON.stringify(this.recs)
        writeFileSync(filename, contents)
    }

    async toFile(filename: string) {
        const contents = JSON.stringify(this.recs)
        await writeFile(filename, contents)
    }

    getRandomRecommendation(all_animes: ItemWithListStatus[]) {
        const resolved = this.recs.map(rec => rec.resolve(all_animes)).filter(e => e != undefined) as ItemWithListStatus[]
        return choice(resolved)
    }
}

const RawThanksSticker = z.string().min(1)
type RawThanksSticker = z.infer<typeof RawThanksSticker>

export class ThanksSticker {
    fileId: string

    private constructor(data: RawThanksSticker) {
        this.fileId = data
    }

    static from(data: unknown) {
        return new this(RawThanksSticker.parse(data))
    }

    static fromArray(data: unknown) {
        return z.array(RawThanksSticker).parse(data).map(sticker => new this(sticker))
    }

    static fromFileId(id: string) {
        return new this(id)
    }

    toJSON() {
        return this.fileId
    }
}

export class ThanksStickers {
    private stickers: ThanksSticker[]

    private constructor(data: ThanksSticker[]) {
        this.stickers = data
    }

    static fromFileSync(filename: string) {
        const contents = readFileSync(filename, { encoding: 'utf-8' })
        const parsed = JSON.parse(contents)
        return new this(ThanksSticker.fromArray(parsed))
    }

    static async fromFile(filename: string) {
        const contents = await readFile(filename, { encoding: 'utf-8' })
        const parsed = JSON.parse(contents)
        return new this(ThanksSticker.fromArray(parsed))
    }

    toFileSync(filename: string) {
        const contents = JSON.stringify(this.stickers)
        writeFileSync(filename, contents)
    }

    async toFile(filename: string) {
        const contents = JSON.stringify(this.stickers)
        await writeFile(filename, contents)
    }

    getRandomSticker() {
        return choice(this.stickers)
    }
}