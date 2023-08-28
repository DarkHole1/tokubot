import { number, z } from 'zod'

export const DanbooruPost = z.object({
    id: z.number(),
    uploader_id: z.number(),
    approver_id: z.number(),
    tag_string: z.string(),
    tag_string_general: z.string(),
    tag_string_artist: z.string(),
    tag_string_copyright: z.string(),
    tag_string_character: z.string(),
    tag_string_meta: z.string(),
    rating: z.union([z.string(), z.null()]),
    parent_id: z.union([z.number(), z.null()]),
    source: z.string(),
    md5: z.string(),
    file_url: z.string(),
    large_file_url: z.string(),
    preview_file_url: z.string(),
    file_ext: z.string(),
    file_size: z.number(),
    image_width: z.number(),
    score: z.number(),
    fav_count: z.number(),
    tag_count_general: z.number(),
    tag_count_artist: z.number(),
    tag_count_copyright: z.number(),
    tag_count_character: z.number(),
    tag_count_meta: z.number(),
    last_comment_bumped_at: z.union([z.coerce.date(), z.null()]),
    last_noted_at: z.union([z.coerce.date(), z.null()]),
    has_children: z.boolean(),
    image_height: z.number(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
})
export type DanbooruPost = z.infer<typeof DanbooruPost>

export const DanbooruPostWithTags = DanbooruPost.transform(post => ({
    ...post,
    tags: post.tag_string.split(' '),
    tags_general: post.tag_string_general.split(' '),
    tags_artist: post.tag_string_artist.split(' '),
    tags_copyright: post.tag_string_copyright.split(' '),
    tags_character: post.tag_string_character.split(' '),
    tags_meta: post.tag_string_meta.split(' ')
}))
export type DanbooruPostWithTags = z.infer<typeof DanbooruPostWithTags>