import { z } from "zod";
import { makeResult } from "./basic";

export const BasicNode = z.object({
    id: z.number().int(),
    title: z.string(),
    main_picture: z.object({
        large: z.string().url().optional(),
        medium: z.string().url()
    }).optional()
})
export type BasicNode = z.infer<typeof BasicNode>

export const BasicItem = z.object({
    node: BasicNode
})
export type BasicItem = z.infer<typeof BasicItem>

export const BasicResult = makeResult(BasicItem)
export type BasicResult = z.infer<typeof BasicResult>

// export const AdvancedNode = BasicNode.merge(z.object({
//     // TODO
// }).partial())
// export type AdvancedNode = z.infer<typeof AdvancedNode>

export const BasicListStatus = z.object({
    status: z.string(),
    score: z.number().int(),
    num_episodes_watched: z.number().int(),
    is_rewatching: z.boolean(),
    updated_at: z.coerce.date()
})
export type BasicListStatus = z.infer<typeof BasicListStatus>

export const ItemWithListStatus = BasicItem.merge(z.object({
    list_status: BasicListStatus
}))
export type ItemWithListStatus = z.infer<typeof ItemWithListStatus>

export const ResultWithListStatus = makeResult(ItemWithListStatus)
export type ResultWithListStatus = z.infer<typeof ResultWithListStatus>