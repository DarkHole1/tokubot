import { readFileSync, writeFileSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { z } from "zod";

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

    async resolve() {
        // TODO
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

    getRandomRecommendation() {
        // TODO
    }
}

const RawThanksSticker = z.string().min(1)
type RawThanksSticker = z.infer<typeof RawThanksSticker>

export class ThanksSticker {
    fileId: string

    private constructor(data: RawThanksSticker) {
        this.fileId = data
    }
}