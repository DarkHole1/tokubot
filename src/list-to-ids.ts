import * as api from './mal/api'
import { Command } from 'commander'
import { exit } from 'process'
import { readFile } from 'fs/promises'

const program = new Command

program
    .argument('<file>')
    .action(async fname => {
        const text = await readFile(fname, { encoding: 'utf-8' })
        const names = text.split('\n').map(name => name.trim())
        const animes = await Promise.all(names.map(name => api.get_anime(name)))
        // console.error(JSON.stringify(animes, null, 2))
        for (const [id, anime] of animes.entries()) {
            if ('error' in anime) {
                console.error('Error occured during searching through api')
                exit(1)
            }
            if (anime.data.length == 0) {
                console.error('No anime found')
                exit(1)
            }
            if (anime.data.length > 1) {
                // console.error('Multiple choice')
                for (let singleAnime of anime.data) {
                    // console.error(singleAnime.node.title)
                    if (singleAnime.node.title == names[id]) {
                        console.error('> ' + singleAnime.node.title)
                        console.log(singleAnime.node.id)
                        break
                    }
                }
                // console.error('===========')
                continue
            }
            console.error(anime.data[0].node.title)
            console.log(anime.data[0].node.id)
        }
    })

program.parse()