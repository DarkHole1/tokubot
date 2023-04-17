# Toku-bot

This is the bot for the [Toku Tonari chat](https://t.me/+hKwe-jzGYV5lOWRi) (RU) and it contains a lot of specific logic. 

However, you can try to start it on the own chat. It will require changing a lot of the hard-coded IDs.

## Installation
```bash
yarn install --production
```

## Starting
Write `.env` file like `.env.example`.
```bash
yarn exec -- ts-node src/index.ts
```
(I will add more correct way... probably)

## What can bot do?
* Checks anime is watched by Toku
* Recommends anime from the Toku's face :D
* Reminds to forward TG posts to the YT
* Sends notifications about the new anime series
