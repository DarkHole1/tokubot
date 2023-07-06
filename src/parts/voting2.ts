import { Composer, Context, InlineKeyboard } from "grammy"
import { Votes } from "../models/votes"
import * as statics from '../static'

export const voting = new Composer
const until = new Date('20 July 2023')
const votes = Votes.loadSync('data/votes2.json')