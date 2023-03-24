import { z, ZodTypeAny } from "zod";

export const Error = z.object({
    "error": z.string(),
    "message": z.string()
})
export type Error = z.infer<typeof Error>

export function makeSuccess<T extends ZodTypeAny>(schema: T) {
    return z.object({
        "data": schema.array(),
        "paging": z.object({
            "previous": z.string(),
            "next": z.string()
        }).partial()
    })
}

export const GenericSuccess = makeSuccess(z.unknown())
export type GenericSuccess = z.infer<typeof GenericSuccess>

export function makeResult<T extends ZodTypeAny>(schema: T) {
    return z.union([Error, makeSuccess(schema)])
}

export const GenericResult = makeResult(z.unknown())
export type GenericResult = z.infer<typeof GenericResult>

