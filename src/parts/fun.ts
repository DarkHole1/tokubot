import { pre } from '@grammyjs/parse-mode'
import { autoQuote } from '@roziscoding/grammy-autoquote'
import { Composer, Context, InputFile } from "grammy"
import type { Sticker } from "grammy/out/types"
import { pluralize } from "numeralize-ru"
import { COFFEE_STICKERS, SHOCK_PATALOCK, TEA_STICKERS, TOKU_CHAT, WORLD_TRIGGER, PON_STICKER, ALCO_STICKERS, TEA_EMOJIS, ALCO_EMOJIS, COFFEE_EMOJIS, NOT_TOMORROW, NADEKO_CALLING, TOMORROW, ADMINS, MONOKUMA, COUNTER, RUBY_MEOW, EIGHTY_SIX, DRAGONBALL, TOMORROW_HAPPY, PATPAT, KUGA_YUMA, LELOUCH_ID, UNDEAD, UNLUCK, NORMIES, KAZAKHSTAN, FIRST_YEAR_SUMMER, TORU, MAHO_AKO, CAT_TORU } from "../constants"
import { DrinkCounters } from "../data"
import { choice, isAdmin } from '../utils'
import { actions, triggerKeeper, triggers } from './trigger-keeper'

export const fun = new Composer
const quoted = fun.use(autoQuote)

const drinksCounters = DrinkCounters.fromFileSyncSafe('data/drinks.json')
const ENABLE_EMOJI = false

const DEBOUNCE_TIME = 5 * 60 * 1000
let lastTime = 0
const debounced = quoted.filter(_ => Date.now() > lastTime + 5 * 60 * 1000)

quoted.on('msg').filter(ctx => ctx.message?.sender_chat?.id == LELOUCH_ID, async (ctx, next) => {
    await ctx.api.setMessageReaction(ctx.msg.chat.id, ctx.msg.message_id, [{
        type: 'emoji',
        emoji: choice(["👍", "👎", "❤", "🔥", "🥰", "👏", "😁", "🤔", "🤯", "😱", "🤬", "😢", "🎉", "🤩", "🤮", "💩", "🙏", "👌", "🕊", "🤡", "🥱", "🥴", "😍", "🐳", "❤‍🔥", "🌚", "🌭", "💯", "🤣", "⚡", "🍌", "🏆", "💔", "🤨", "😐", "🍓", "🍾", "💋", "🖕", "😈", "😴", "😭", "🤓", "👻", "👨‍💻", "👀", "🎃", "🙈", "😇", "😨", "🤝", "✍", "🤗", "🫡", "🎅", "🎄", "☃", "💅", "🤪", "🗿", "🆒", "💘", "🙉", "🦄", "😘", "💊", "🙊", "😎", "👾", "🤷‍♂", "🤷", "🤷‍♀", "😡"])
    }])
    await next()
})

const hasCaptionHashtag = (hashtag: string) => (ctx: Context) => {
    const caption = ctx.msg?.caption
    const enttities = ctx.msg?.caption_entities
    if (!caption || !enttities) {
        return false
    }
    return enttities.some(v => v.type == 'hashtag' && caption.slice(v.offset, v.offset + v.length) == hashtag)
}

quoted.on(':caption_entities:hashtag').filter(hasCaptionHashtag('#dunmeshi'), async (ctx, next) => {
    await ctx.api.setMessageReaction(ctx.msg.chat.id, ctx.msg.message_id, [{
        type: 'emoji',
        emoji: "❤"
    }])
    await next()
})

quoted.on('edit:caption_entities:hashtag').filter(hasCaptionHashtag('#dunmeshi'), async (ctx, next) => {
    await ctx.api.setMessageReaction(ctx.msg.chat.id, ctx.msg.message_id, [{
        type: 'emoji',
        emoji: "❤"
    }])
    await next()
})

fun.use(triggerKeeper([
    triggers.regex('п(а|a)т(а|a)л(о|o)к|501\\s?271|область', actions.reply.audio(SHOCK_PATALOCK)),
    triggers.wholeWord('пон', actions.reply.sticker(PON_STICKER)),
    triggers.wholeWord('ало|алло|алё', actions.reply.gif(NADEKO_CALLING)),
    triggers.regex('пидор', actions.reply.text('ОБНАРУЖЕНА ДЕМОНИЧЕСКАЯ УГРОЗА')),
    triggers.regex('не\\s+ешь', actions.preciseReply.text('Ням!')),
    triggers.regex('противоречи', actions.reply.gif(COUNTER)),
    triggers.regex('Руби мяу', actions.reply.voice(RUBY_MEOW)),
    triggers.debounced(DEBOUNCE_TIME).regex('([^\\d]|^)86([^\\d]|$)|восемьдесят шесть', actions.reply.photo(EIGHTY_SIX)),
    triggers.debounced(DEBOUNCE_TIME).regex('анлак', actions.reply.sticker([UNDEAD, UNLUCK])),
    triggers.debounced(DEBOUNCE_TIME).wholeWord('дб', actions.reply.sticker(DRAGONBALL)),
    triggers.debounced(DEBOUNCE_TIME).regex('драгонбол', actions.reply.video(DRAGONBALL)),
    triggers.debounced(DEBOUNCE_TIME).regex('триггер', actions.reply.photo(KUGA_YUMA)),
    triggers.debounced(DEBOUNCE_TIME).regex('нормис', actions.reply.photo(NORMIES)),
    triggers.debounced(DEBOUNCE_TIME).regex('казахстан|караганд', actions.reply.photo(KAZAKHSTAN)),
    triggers.debounced(DEBOUNCE_TIME).regex('([^\\d]|^)121([^\\d]|$)|лето первого года', actions.reply.gif(FIRST_YEAR_SUMMER)),
    triggers.debounced(DEBOUNCE_TIME).ignoreCase('(^|[^ко])(toru|тору)', actions.reply.gif(TORU)),
    triggers.debounced(DEBOUNCE_TIME).ignoreCase('catoru|cattoru|котору', actions.reply.gif(CAT_TORU)),
    triggers.debounced(DEBOUNCE_TIME).ignoreCase('mahoako|махоако', actions.reply.gif(MAHO_AKO))
]))

quoted.hears(/(\P{L}|^)бан(\P{L}|$)/gimu).filter(
    isAdmin,
    ctx => ctx.replyWithAnimation(MONOKUMA)
)

quoted.command(
    'inspect',
    ctx => {
        const text = JSON.stringify(ctx.msg.reply_to_message, null, 2)
        if (text.length > 2048) {
            return ctx.replyWithDocument(new InputFile(Buffer.from(text), 'inspect.json'))
        }
        const msg = pre(JSON.stringify(ctx.msg.reply_to_message, null, 2), 'json')
        return ctx.reply(msg.toString(), { entities: msg.entities })
    }
)

quoted.command('bingo', ctx => ctx.reply('https://docs.google.com/spreadsheets/d/1QghSAYndgtDBDYPjEO1FNsMsP765zHK-wAFDF9Q1h9Y/edit#gid=0'))

// Tomorrow
debounced.hears(/(\P{L}|^)завтра(\P{L}|$)/ui, ctx => (lastTime = Date.now(), ctx.replyWithVideo(Math.random() > 0.3 ? NOT_TOMORROW : (Math.random() > 0.3 ? TOMORROW_HAPPY : TOMORROW))))

quoted.filter(ctx => ctx.msg?.sticker?.file_unique_id == 'AgADjRQAAqfaKUs', ctx => ctx.replyWithAnimation(PATPAT))

quoted.hears(/^Руби,? (.+?) или (.+?)\??$/i, async ctx => {
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
                    break
                case 360:
                    achivement = 'Когда исчезнет Британская империя, историки обнаружат, что она сделала два неоценимых вклада в цивилизацию — чайный ритуал и детективный роман'
                    break
                case 370:
                    achivement = 'Непременно выпей чаю. Чай здесь отличный. Индийский, разумеется. Может, мы с ними и воюем, но чай они делают самый лучший'
                    break
                case 380:
                    achivement = '― Я уже отчаялась...\n― Отчаялась? – повторила она. – Разве ты пьешь чай, а не молоко? Не знаю, как это можно пить чай! Да еще утром!'
                    break
                case 390:
                    achivement = 'Печаль делает чай вкуснее.'
                    break
                case 400:
                    achivement = 'Всякий знает, что для повышения тонуса и поднятия упавшего духа нет ничего лучше чашечки чая, в чём сходятся все руководства и наставления, как западные, так и восточные.'
                    break
                case 410:
                    achivement = 'А император с семьей чай пьют. Самовар матерущий, артельный. У кажногу прибору ситного фунта по три. Харчей много!'
                    break
                case 420:
                    achivement = 'Чай начинался как лекарство и вырос до напитка.'
                    break
                case 430:
                    achivement = 'Если вам холодно, чай вас согреет; если слишком жарко, чай вас охладит; если вы огорчены, он подбодрит вас; если возбуждены - успокоит.'
                    break
                case 440:
                    achivement = 'Горячий чай не решит ваших проблем.\nНо он сделает вашу жизнь на градус приятнее.'
                    break
                case 450:
                    achivement = 'Быстрый способ создать счастье:цветы и чашечка любимого напитка.'
                    break
                case 460:
                    achivement = 'Интересно, чай — это у нас врожденное? У русских есть водка, у французов — секс. Мы, британцы, находим успокоение на дне заварочного чайника.'
                    break
                case 470:
                    achivement = '— Как ты думаешь, они уже захлебнулись? — допивая уже четвёртую кружку чая спросила я\n— Не знаю.. — ты пожал плечами, — а в тебя влезет ещё кружка?\n— Неа, — помотала я головой — уже нет наверно, ну а если и влезет — то из ушей точно уже побегут ручейки…\nЗаливать обиды чаем — было странной идеей…\nс другой стороны — ну не алкоголем же — он него обиды только растут и крепнут…\nВ любом случае чай — это лучше, пожалуй, чем выяснять кто прав, а кто нет\nВкуснее точно, а если закрыть глаза — то можно увидеть чайное озеро, как в телевизоре\nпусть и с помехами посторонних мыслей…\nТы посмотрел на меня очень серьёзно и протянул конфету:\n— Ну что, самое время запустить первый кораблик.'
                    break
                case 500:
                    achivement = 'Чай. Жизнь, наверное, была просто невыносимой до того, как у нас появился чай. Абсолютно несносной. Не могу понять, как люди вообще могли существовать без чая.'
                    break
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
