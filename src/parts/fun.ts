import { pre } from '@grammyjs/parse-mode'
import { autoQuote } from '@roziscoding/grammy-autoquote'
import { Composer, InputFile } from "grammy"
import type { Sticker } from "grammy/out/types"
import { pluralize } from "numeralize-ru"
import { COFFEE_STICKERS, SHOCK_PATALOCK, TEA_STICKERS, TOKU_CHAT, WORLD_TRIGGER, PON_STICKER, ALCO_STICKERS, TEA_EMOJIS, ALCO_EMOJIS, COFFEE_EMOJIS, NOT_TOMORROW, NADEKO_CALLING, TOMORROW, ADMINS, MONOKUMA, COUNTER, RUBY_MEOW, EIGHTY_SIX, DRAGONBALL } from "../constants"
import { DrinkCounters } from "../data"
import { choice } from '../utils'

export const fun = new Composer
const quoted = fun.use(autoQuote)

const drinksCounters = DrinkCounters.fromFileSyncSafe('data/drinks.json')
const ENABLE_EMOJI = false

// Похвала
quoted.filter(_ => Math.random() > 0.998, ctx => ctx.reply('Ты умничка'))

// ШОК ПАТАЛОК
quoted.hears(/п(а|a)т(а|a)л(о|o)к|501\s?271|область/gim, ctx => ctx.replyWithAudio(SHOCK_PATALOCK))

quoted.hears(/триггер/gim, ctx => ctx.replyWithSticker(WORLD_TRIGGER))

// Пон
quoted.hears(/(\P{L}|^)пон(\P{L}|$)/gimu, ctx => ctx.replyWithSticker(PON_STICKER))

// Nadeko
quoted.hears(/(\P{L}|^)ало(\P{L}|$)/gimu, ctx => ctx.replyWithAnimation(NADEKO_CALLING))

// P-word
quoted.hears(/пидор/i, ctx => ctx.reply('ОБНАРУЖЕНА ДЕМОНИЧЕСКАЯ УГРОЗА'))

quoted.hears(/не\s+ешь/i, ctx => ctx.reply('Ням!'))

quoted.hears(/(\P{L}|^)бан(\P{L}|$)/gimu).filter(
    ctx => ADMINS.includes(ctx.from?.id ?? 0),
    ctx => ctx.replyWithAnimation(MONOKUMA)
)

quoted.hears(/противоречи/i, ctx => ctx.replyWithAnimation(COUNTER))

quoted.hears(/Руби мяу/i, ctx => ctx.replyWithVoice(choice(RUBY_MEOW)))

quoted.hears(/86|восемьдесят шесть/i, ctx => ctx.replyWithPhoto(EIGHTY_SIX))

quoted.hears(/(\P{L}|^)дб(\P{L}|$)|драгонбол/iu, ctx => ctx.replyWithVideo(DRAGONBALL))

quoted.command(
    'inspect',
    ctx => {
        const text = JSON.stringify(ctx.msg.reply_to_message, null, 2)
        if(text.length > 2048) {
            return ctx.replyWithDocument(new InputFile(Buffer.from(text), 'inspect.json'))
        }
        const msg = pre(JSON.stringify(ctx.msg.reply_to_message, null, 2), 'json')
        return ctx.reply(msg.toString(), { entities: msg.entities })
    }
)

// Tomorrow
quoted.hears(/(\P{L}|^)завтра(\P{L}|$)/ui, ctx => ctx.replyWithVideo(Math.random() > 0.3 ? NOT_TOMORROW : TOMORROW))

quoted.hears(/^Руби, (.+) или (.+)\?$/i, async ctx => {
    const a = ctx.match[1]
    const b = ctx.match[2]
    let res: string
    const random = Math.random()
    const donuts = 0.99
    console.log(random)
    if (a.toLowerCase() == 'или' || b.toLowerCase() == 'или' || random > donuts) {
        res = 'Пончики'
    } else if (random <= donuts * 0.5) {
        res = a[0].toUpperCase() + a.slice(1)
    } else {
        res = b[0].toUpperCase() + b.slice(1)
    }
    await ctx.reply(res)
})

quoted.on(':sticker').filter(ctx => ctx.msg.chat.id == TOKU_CHAT, async ctx => {
    let drink: string
    let count: number
    let emoji: string
    let achivement = ''

    const stickerType = classifySticker(ctx.msg.sticker)

    if (!stickerType) {
        return
    }

    switch (stickerType) {
        case 'tea':
            drinksCounters.tea += 1
            drink = 'чя'
            count = drinksCounters.tea
            emoji = TEA_EMOJIS[0]
            switch (count) {
                case 1:
                    achivement = 'Чай буш?'
                    break
                case 28:
                    achivement = 'Вы выпили ведро чя :0'
                    break
                case 75:
                    achivement = 'Хватит на аквариум. С чаем.'
                    break
                case 80:
                    achivement = '"Замечательный день сегодня. То ли чай пойти выпить, то ли повеситься." (приписывается А.П.Чехову)'
                    break
                case 90:
                    achivement = '"Чай! Вот что мне было нужно! Хорошая чашка чая! Перегретый настой свободных радикалов и танина, он просто создан для здоровья." (c) 10 Доктор'
                case 100:
                    achivement = 'Твой чй пронзит небеса!'
                    break
                case 110:
                    achivement = '— Хочешь чаю?\n— Хм... Чай... Мы только и делаем тут, что пьем чай. Поражаюсь, как мы в нем еще не захлебнулись.\n(Отголоски прошлого)'
                    break
                case 120:
                    achivement = 'Чаю? Это как объятия. Только в чашке. (Менталист)'
                    break
                case 130:
                    achivement = 'Такие нынче времена, — изрёк мистер Норрис, приняв чашку чая, — тебе мешают жить, а ты мешаешь ложечкой чай.'
                    break
                case 140:
                    achivement = 'Не пей чай там, где тебя ненавидят.'
                    break
                case 150:
                    achivement = '"Я должен был пить много чая, ибо без него не мог работать. Чай высвобождает те возможности, которые дремлют в глубине моей души." Лев Толстой'
                    break
                case 200:
                    achivement = 'Пора заводить чаегонный аппарт на 60 литров.'
                    break
                case 210:
                    achivement = 'Собирая чайные листья на плантации Липтона, индус Мохаммед даже не подозревает, что он это делает бережно и с любовью.'
                    break
                case 220:
                    achivement = '— А может зайдём ко мне на чай?\n— Только на чай?\n— Нет... ещё на варенье.'
                    break
                case 230:
                    achivement = 'Чай. Жизнь, наверное, была просто невыносимой до того, как у нас появился чай. Абсолютно несносной. Не могу понять, как люди вообще могли существовать без чая.'
                    break
                case 240:
                    achivement = '— Как ты скажешь: «Gimme a coffee», «Can I get a coffee», «You wanna gimme a coffee» или «May I have a coffee, please? Not hurry. When you’ve got a moment»?\n— Это вопрос с подвохом, не так ли? Я предпочту чай.'
                    break
                case 250:
                    achivement = 'Теперь вы полностью состоите из чая.'
                    break
                case 260:
                    achivement = 'Писатели обожают пить кофе, многие — пить чай. Так некоторые совсем спиваются.'
                    break
                case 270:
                    achivement = '— Что такое чай?\n— О, вредный настой восточных листьев, содержащий высокий процент ядовитой кислоты.\n— Похоже, дурной напиток, не так ли?\n— Да. Лично мне весьма нравится.'
                    break
                case 280:
                    achivement = 'Зелёных чаев она не признавала, ещё более презирала травяные настои, по недоразумению называемые чаями. Чай в её представлении должен был быть чёрным, как дёготь, и крепким, как совесть грешника.\nНу или наоборот. Чёрным, как совесть, и крепким, как дёготь.'
                    break
                case 290:
                    achivement = 'Весь день спорили, с чего начинается утро. Халк говорит, что с кофе, я — что с чая. Пришел Кот и сказал, что утро начинается с «У».'
                    break
                case 300:
                    achivement = 'Хватит чтобы наполнить стиральную машину. Чаем, конечно же.'
                case 1337:
                    achivement = '31337 t34'
                    break
            }
            break

        case 'coffee':
            drinksCounters.coffee += 1
            drink = 'кфе'
            count = drinksCounters.coffee
            emoji = COFFEE_EMOJIS[0]
            switch (count) {
                case 1:
                    achivement = 'На этом ты не остановишься. Так мне сказал мой побочный эффект.'
                    break
                case 50:
                    achivement = 'What is this, a coffee episode?'
                    break
                case 60:
                    achivement = 'Ничто на свете не даётся даром. Даже кофе.'
                    break
                case 70:
                    achivement = 'Go beyond! Plus coffee'
                    break
                case 80:
                    achivement = 'I can\'t go on like this. I\'ll drink coffee!'
                    break
                case 90:
                    achivement = 'More importantly, where\'s coffee!?'
                    break
                case 100:
                    achivement = 'Ты выпил 100 чашек кофе? Как мило'
                    break
                case 150:
                    achivement = 'Во-первых, у тебя лишь сто пятьдесят чашек кофе. Во-вторых, делай, как я говорю, и не вздумай пить меньше кофе. В-третьих, что бы ни было в прошлом, чашки чая тебя не касаются'
                    break
                case 200:
                    achivement = 'Сломай систему, посмотри аниме, где милые девочки пьют кфе.'
                    break
                case 250:
                    achivement = 'Wonder Coffee Priority'
                    break
                case 300:
                    achivement = 'Half human, half coffee, completely awesome.'
                    break
                case 1300:
                    achivement = 'Этого достаточно чтобы наполнить ванну!'
                    break
            }
            break

        case 'alco':
            drinksCounters.alco += 1
            drink = 'алк'
            count = drinksCounters.alco
            emoji = ALCO_EMOJIS[0]
            switch (count) {
                case 1:
                    achivement = 'На этом ты не остановишься. Так мне сказал мой побочный эффект.'
                    break
                case 5:
                    achivement = 'В раю нет пива, поэтому мы пьём его на этой грешной земле.'
                    break
                case 10:
                    achivement = 'Хорошие люди пьют хорошее пиво.'
                    break
                case 20:
                    achivement = 'Я не верю ни во что, кроме любви. И пива.'
                    break
                case 30:
                    achivement = 'Я вообще не пью молоко. Молоко это для младенцев, а когда вырастаешь нужно пить пиво.'
                    break
                case 40:
                    achivement = 'Дураки учатся на своих ошибках, умные на чужих, а мудрые смотрят на них и не спеша пьют пиво.'
                    break
                case 50:
                    achivement = 'Люблю писать песни. Люблю, когда меня окружают настоящие друзья. Люблю путешествовать. И люблю играть на гитаре. Кроме того, люблю бесплатное пиво.'
                    break
                case 60:
                    achivement = 'Вы боитесь умирать?\n— Кто — я? Ну уж нет! Я так близко к смерти подходил пару раз, что не боюсь. Когда к ней так близко, тебе, пожалуй, даже хорошо. Ты просто такой: «Ну ладно, ладно». Особенно, по-моему, если в Бога не веришь, тебя не волнует, куда попадёшь — в рай или ад, и ты просто отбрасываешь всё, чем занимался. Грядёт какая-то перемена, новое кино покажут, поэтому, что бы там ни было, ты говоришь: «Ладно». Когда мне было тридцать пять, меня в больнице объявили покойником. А я не умер. Я вышел из больницы — причём мне велели никогда больше не пить, или я точно умру, — и прямым ходом отправился в бар, где и выпил пива. Нет, два пива!'
                    break
                case 70:
                    achivement = '17 июня. <…> Вдоль Рейна. Вспоминал летнюю поездку. Две еды, частые выпивки кофе и пива, чтобы убить время и тоску, которая тем более душила, что книга попалась подлая La terre Zola. Я решительно ненавижу этого скота, не смотря на весь его талант.'
                    break
                case 80:
                    achivement = 'Я не торгую ни газом, ни огурцами, ни пивом, ни салом — ничем. Вот это коммерческий вопрос. Они там между собой должны договориться. Но цена, конечно, должна быть рыночной. Это очевидно.'
                    break
                case 90:
                    achivement = 'В больнице Института Блохина Светлов умирал от рака. Не стал пить принесённый коньяк и сказал грустно: «К раку пиво надо…»'
                    break
                case 100:
                    achivement = 'Невозможно! Невозможно предугадать этот генератор случайных чисел! Она сидит утром, бледная, обхватив голову руками, вздыхает:\n— Ой, как мне плохо… Вчера пили водку, потом пиво, потом коньяк… Наверное, винегретом отравилась.'
                    break
            }
            break
    }

    await drinksCounters.toFile('data/drinks.json')
    await ctx.reply(`Приятного! Попили ${drink} ${count} ${pluralize(count, 'раз', 'раза', 'раз')}  ${emoji}\n${achivement}`)
})

quoted.hears(/Руби,? что ты умеешь\??/i, ctx => ctx.reply(`
Я всё умею!
1. Могу предложить аниме от лица Току через /recommend
2. Если вы уже всё посмотрели оттуда, то могу порекомендовать из расширенного списка через /recommendExtended
3. Уведомляю всех любимок в Токучате об выходе новых серий их аниме. А посмотреть список аниме за которыми я наблюдаю можно через команду /observed
4. Ты умничка!
5. Вообще-то я умею проверять, есть ли аниме в списке просмотренного у Току через /hastokuwatched (название аниме). Но это работает только с основными названиями...
7. Могу похвалить тебя. Иногда. Как я сделала в пункте 4
8. Помогаю Току не забывать постить на юбуб
9. Ну и даже не думай произносить запрещённые здесь, я тебя найду и уничтожу
10. Ты заметил что тут нет пункта 6? На спасибо я отвечу "пожалуйста", но стикером :3
11. Иногда я провожу голосования за тайтлы... возможно даже прямо сейчас. Напиши мне в личку /startvoting
12. Каждый день, я отправляю картинку с BRS
13. У меня есть функция поиска источника изображения - просто ответь на сообщение с картинкой /backarrow и я сделаю всё что могу
14. Ещё у меня где-то в коде есть брат, который появляется при фатальной ошибке... но его никто не видел
15. Делу время - потехе 10 функций. Я умею считать выпитые чаи, кфе и алк
16. Ни один паталок не будет пропущен! Фирменная мелодия должна играть всегда на паталок.фм
17. Триггер, активация... отправки стикера
18. Пон
19. Скажи "ало" если хочешь увидеть Надеко
20. Не надо отговаривать меня не есть. На любое "не ешь" у меня есть точный ответ
21. Слово "бан" будет сопровождаться красивой анимацией... но лишь у админов
22. Напиши "Руби, Х или У?" чтобы выбрать между Х и У.
23. "завтра" это слишком мощный триггер
24. Драгонболл и 86 заслуживают упоминания в любом случае
25. Каждое "противоречие" будет отмечено
26. А ещё ты меня можешь попросить мяукнуть через "Руби мяу"
`))

type Counters = 'tea' | 'coffee' | 'alco'

function classifySticker(sticker: Sticker): Counters | null {
    const { file_unique_id } = sticker

    if (TEA_STICKERS.includes(file_unique_id)) {
        return 'tea'
    }

    if (COFFEE_STICKERS.includes(file_unique_id)) {
        return 'coffee'
    }

    if (ALCO_STICKERS.includes(file_unique_id)) {
        return 'alco'
    }

    if (!ENABLE_EMOJI) return null

    const { emoji } = sticker

    if (!emoji) return null

    if (TEA_EMOJIS.includes(emoji)) {
        return 'tea'
    }

    if (COFFEE_EMOJIS.includes(emoji)) {
        return 'coffee'
    }

    if (ALCO_EMOJIS.includes(emoji)) {
        return 'alco'
    }

    return null
}
