import { bold, code, fmt, italic, link, spoiler } from "@grammyjs/parse-mode"

export const start = fmt
`Привет! Я Руби и мои возможности безграничны (подивиться можно ${link(`тут`, `https://t.me/tokutonarinotofficialbot_updates/3`)}).

Cписок людей, которых я очень-очень-очень-очень-очень уважаю:
* Мария
* Всеволод, просто Всеволод
* Шок Паталок
* Amelia~
* Neko Arc
* marvin
* Марат
* Denis Redbull

Вот и всё! Связаться с разработчиком можно через личку @darkhole1.`

export const greeting = fmt
`Nyanpasu~

Приходи, присаживайся, читай ${link(`правила`, `https://t.me/2000257215/361`)} и список рекомендуемых аниме к ${link(`просмотру`, `https://t.me/2000257215/410`)}, а также ${link(`список проектов участников`, `https://t.me/2000257215/422`)} и ${link(`список их списков тайтлов`, `https://t.me/2000257215/425`)}.`

export const greetingOld = fmt
`Nya~~ хотя подождите, вы оказались в неправильном чате. Все обсуждения происходят в ${link(`другом чате`, `https://t.me/+OmoqFQZUVs03MjVi`)}. Тут остались лишь комментарии к постам.
`

export const post = fmt
`Бип-боп, это Руби, бот канала! 

Приглашаем вас в ${link(`чат канала`, `https://t.me/+OmoqFQZUVs03MjVi`)}, который как бы про аниме, но на деле вообще про все, что не запрещено правилами! 

Также, вот ${link(`список ссылок`, `https://t.me/tokutonari/614`)}, в котором есть все самые важные источники Току!

Если вам очень нравится этот канал и вы хотите поддержать его финансово, то вот ссылка на ${link(`Boosty`, `https://boosty.to/tokutonari`)}! 

И да, Току, не забудь запостить на юбуб!
`

export const startVoting = 
`Добро пожаловать на голосования за тайтлы лета (лучшие и не только). У вас будет выбор между "не смотрел и не планирую", "не смотрел, но планирую", "дропнул", "смотрю" и оценкой от 1 до 10. Пожалуйста, оценивайте тайтл только когда вы его досмотрели. 

Вы можете использовать команду ${code('/startvoting YourShikiName')} для того чтобы быстро проголосовать, но твой список для этого должен быть публичным. А ну и да, вы можете переголосовать в любой момент или начать голосвание с нуля.

Если обнаружили ошибку или отсутствие чего-то важного, пишите моему создателю - @darkhole1.`

const tryCapitalize = (s: string, really = true) => really ? s[0].toUpperCase() + s.slice(1) : s

export const formatUpdate = ({ anime, russian, episode, completed }: { anime: string, russian?:string, episode: number, completed: boolean }, capitalize = false) => fmt
`${completed ? tryCapitalize('последняя ', capitalize) : ''}${episode} серия ${anime}${russian ? fmt` / ${spoiler(russian)}` : ''}`

export const missMessage = fmt
`Упс, кажется вы хотели оставить комментарий к посту, но промазали. Ответьте на любое сообщение или сам пост чтобы оно было видно в комментариях.

А для обычных обсуждений у нас есть ${link(`другой чат`, `https://t.me/+OmoqFQZUVs03MjVi`)}.`
