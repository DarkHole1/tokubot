import { z } from "zod"
import { readFileSync, writeFile } from "fs-extra"

export const Answers = z.enum([
    'not_planning', 'planning',
    'dropped', 'not_finished',
    '1', '2', '3', '4', '5',
    '6', '7', '8', '9', '10'
])
export type Answers = z.infer<typeof Answers>

export const RawVotes2 = z.array(z.object({
    name: z.string(),
    russian: z.string(),
    url: z.string(),
    votes: z.record(Answers),
    hidden: z.boolean().optional().default(false)
}))
export type RawVotes2 = z.infer<typeof RawVotes2>

export class Votes2 {
    private votes: RawVotes2

    private constructor(votes: RawVotes2) {
        this.votes = votes
    }

    static loadSync(filename: string) {
        const contents = readFileSync(filename, { encoding: 'utf-8' })
        const parsed = JSON.parse(contents)
        return new this(RawVotes2.parse(parsed))
    }

    async save(filename: string) {
        const contents = JSON.stringify(this.votes)
        await writeFile(filename, contents)
    }

    addVote(id: number, member: number, answer: Answers) {
        if (!this.votes[id]) {
            return
        }
        this.votes[id].votes[member] = answer
    }

    get(id: number) {
        return this.votes[id]
    }

    get length() {
        return this.votes.length
    }

    unique() {
        const uniqueVotes = new Set(this.votes.flatMap(anime => Object.keys(anime.votes)))
        return uniqueVotes.size
    }

    selectNext(id = -1) {
        for (let newId = id + 1; newId < this.length; newId++) {
            const anime = this.get(newId)
            if (!anime.hidden) {
                return { id: newId, anime }
            }
        }
        return { id: -1, anime: undefined }
    }

    count() {
        const res: { [k in Answers]: number } = {
            'not_planning': 0, 'planning': 0,
            'dropped': 0, 'not_finished': 0,
            '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
            '6': 0, '7': 0, '8': 0, '9': 0, '10': 0
        }

        for(const anime of this.votes) {
            for(const vote of Object.values(anime.votes)) {
                res[vote]++
            }
        }

        return res
    }
}