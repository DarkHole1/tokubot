import { z } from "zod"
import { readFileSync, writeFile } from "fs-extra"

export const RawVotes = z.array(z.object({
    name: z.string(),
    russian: z.string(),
    url: z.string(),
    votes: z.array(z.number().int())
}))
export type RawVotes = z.infer<typeof RawVotes>

export class Votes {
    private votes: RawVotes

    private constructor(votes: RawVotes) {
        this.votes = votes
    }

    static loadSync(filename: string) {
        const contents = readFileSync(filename, { encoding: 'utf-8' })
        const parsed = JSON.parse(contents)
        return new this(RawVotes.parse(parsed))
    }

    async save(filename: string) {
        const contents = JSON.stringify(this.votes)
        await writeFile(filename, contents)
    }

    addVote(id: number, member: number) {
        if(!this.votes[id]) {
            return
        }
        if(this.votes[id].votes.includes(member)) {
            return
        }
        this.votes[id].votes.push(member)
    }

    removeVote(id: number, member: number) {
        if(!this.votes[id]) {
            return
        }
        this.votes[id].votes = this.votes[id].votes.filter(e => e != member)
    }

    get(id: number) {
        return this.votes[id]
    }

    get length() {
        return this.votes.length
    }
}