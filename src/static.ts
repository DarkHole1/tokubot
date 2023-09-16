import { code, fmt, link, spoiler } from "@grammyjs/parse-mode"

export const help = fmt
`Этот бот умеет:
* Проверять есть ли аниме в просмотренном у Току. Попробуйте скопировать и отправить ${code(`/hastokuwatched Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen`)}. Пока что поддерживаются только основные названия с MyAnimeList :C
* Делать рекомендации на основе списка Току. Попробуйте скопировать и отправить ${code(`/recommend`)}

Вот и всё! Связаться с разработчиком: @darkhole1`

export const greeting = fmt
`Nyanpasu~

Приходи, присаживайся, читай ${link(`правила`, `https://t.me/c/1311183194/252813`)} и список рекомендуемых аниме к ${link(`просмотру`, `https://t.me/c/1311183194/84785`)}`

export const startVoting = 
`Добро пожаловать на голосования за тайтлы осени. Тайтлы набравшие больше 30% голосов попадут в отслеживание.

А ну и да, вы можете переголосовать в любой момент или начать голосвание с нуля.

Если обнаружили ошибку или отсутствие чего-то важного, пишите моему создателю - @darkhole1.`

const tryCapitalize = (s: string, really = true) => really ? s[0].toUpperCase() + s.slice(1) : s

export const formatUpdate = ({ anime, russian, episode, completed }: { anime: string, russian?:string, episode: number, completed: boolean }, capitalize = false) => fmt
`${completed ? tryCapitalize('последняя ', capitalize) : ''}${episode} серия ${anime}${russian ? fmt` / ${spoiler(russian)}` : ''}`