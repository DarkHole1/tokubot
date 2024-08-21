import cron from 'node-cron'
import { request } from 'graphql-request'
import { ProfileModel } from '../models/profile'
import debug from 'debug'
import { API } from 'shikimori'
import { StatsEntryModel, StatsModel } from '../models/stats'

const log = debug('app:parts:collect-stats')

const GetAnimesInList = `
  query($targetType: UserRateTargetTypeEnum!, $userId: ID, $limit: Int, $page: Int){
    userRates(targetType: $targetType, userId: $userId, limit: $limit, page: $page) {
      episodes
      anime {
        status
        name
        id
        episodesAired
        episodes
        duration
      }
      status
    }
  }
`

const shikimori = new API({
    baseURL: 'https://shikimori.one/api',
    axios: {
        headers: {
            'Accept-Encoding': '*'
        }
    }
})

export function collectStats() {
    cron.schedule('0 0 0,12 * * *', async () => {
        log('Starting collection logs')
        const profiles = await ProfileModel.find({
            shikimoriUsername: { $exists: true }
        })

        log(`%d profiles found`, profiles.length)

        for (const profile of profiles) {
            log(`Processing profile %s`, profile.shikimoriUsername)
            try {
                let userId = profile.shikimoriId
                if (!userId) {
                    log(`Shikimori id not found, fetching`)
                    const username = profile.shikimoriUsername!
                    const data = await shikimori.users.getById({
                        id: username,
                        is_nickname: 1
                    })
                    userId = data.id
                    profile.shikimoriId = userId
                    await profile.save()
                }

                let userStats = await StatsModel.findOne({ telegramID: profile.telegramID })
                if(!userStats) {
                    userStats = new StatsModel({
                        telegramID: profile.telegramID
                    })
                }
                let statsEntry = new StatsEntryModel({
                    watchedMinutes: 0,
                    plannedMinutes: 0,
                    date: new Date(),
                    telegramID: profile.telegramID
                })

                let page = 1
                while(true) {
                    log(`Fetching page %d of user list`, page)
                    const data: any = await request(`https://shikimori.one/api/graphql`, GetAnimesInList, {
                        targetType: 'Anime',
                        userId,
                        limit: 50,
                        page
                    })
                    if (data.userRates.length <= 0) break

                    for (const rate of data.userRates) {
                        const episodesReleased = rate.anime.status == 'released' ? rate.anime.episodes : rate.anime.episodesAired
                        const episodesWatched = rate.episodes
                        const minutesTotal = episodesReleased * rate.anime.duration
                        const minutesWatched = episodesWatched * rate.anime.duration
                        const minutesLeft = (episodesReleased - episodesWatched) * rate.anime.duration
                        if(minutesLeft < 0) {
                            log(`Abnormal anime %s [%d] (%d/%d)`, rate.anime.name, rate.anime.id, episodesWatched, episodesReleased)
                            log(rate)
                        }

                        statsEntry.watchedMinutes += minutesWatched
                        statsEntry.plannedMinutes += minutesLeft
                    }

                    await delay(800)
                    page++
                }

                await statsEntry.save()
                if(!userStats.initial) {
                    userStats.initial = statsEntry
                }
                userStats.currentPlannedMinutes = statsEntry.plannedMinutes
                userStats.currentWatchedMinutes = statsEntry.watchedMinutes
                await userStats.save()
            } catch (e) {
                log(`An error occured %o`, e)
            }
        }
    })
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}