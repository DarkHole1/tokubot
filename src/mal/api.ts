import axios from "axios"
import * as client from './client'
import { BasicResult, ResultWithListStatus } from "./types/animelist"

type GetUserAnimeListParameters = Partial<{
    status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch',
    sort: 'list_score' | 'list_updated_at' | 'anime_title' | 'anime_start_date',
    limit: number,
    offset: number
}>

const instance = axios.create({
    baseURL: 'https://api.myanimelist.net/v2',
    headers: { 'X-MAL-CLIENT-ID': client.ID }
})

export async function get_user_anime_list(user_name: '@me' | (string & {}), options: GetUserAnimeListParameters = {}) {
    const res = await instance.get<unknown>(`/users/${user_name}/animelist`, {
        params: options
    })
    return BasicResult.parse(res.data)
}

export async function get_user_anime_list_with_list_status(user_name: '@me' | (string & {}), options: GetUserAnimeListParameters = {}) {
    const res = await instance.get<unknown>(`/users/${user_name}/animelist`, {
        params: { ...options, fields: 'list_status' }
    })
    return ResultWithListStatus.parse(res.data)
}

export async function get_anime(query: string) {
    const res = await instance.get<unknown>(`/anime`, {
        params: {
            q: query,
            limit: 100
        }
    })

    return BasicResult.parse(res.data)
}