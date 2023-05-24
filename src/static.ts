import { code, fmt, linkMessage } from "@grammyjs/parse-mode"

export const help = fmt
`Этот бот умеет:
* Проверять есть ли аниме в просмотренном у Току. Попробуйте скопировать и отправить ${code(`/hastokuwatched Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen`)}. Пока что поддерживаются только основные названия с MyAnimeList :C
* Делать рекомендации на основе списка Току. Попробуйте скопировать и отправить ${code(`/recommend`)}

Вот и всё! Связаться с разработчиком: @darkhole1`

export const greeting = fmt
`Nyanpasu~

Приходи, присаживайся, читай ${linkMessage(`правила`, 1311183194, 11885)} и список рекомендуемых аниме к ${linkMessage(`просмотру`, 1311183194, 84785)}`