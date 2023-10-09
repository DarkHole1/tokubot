"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const mongoose_1 = require("mongoose");
const config_1 = require("../src/config");
const brs_1 = require("../src/models/brs");
const counters_1 = require("../src/models/counters");
const everyday_post_1 = require("../src/models/everyday-post");
const debug_1 = require("debug");
const log = (0, debug_1.debug)('script:wt2mongo');
log('Loading config & wt file');
const config = new config_1.Config();
const wtFile = brs_1.RawBRS.parse(JSON.parse((0, fs_extra_1.readFileSync)('data/world-trigger.json', { encoding: 'utf-8' })));
log('Loaded');
void (async () => {
    log('Starting connecting to mongo...');
    await mongoose_1.default.connect(config.MONGODB_URI);
    log('Connected to mongodb');
    const counters = await counters_1.CountersModel.findOne();
    if (!counters) {
        log('Counter not found');
        await counters_1.CountersModel.create({ worldTriggerDays: wtFile.days });
    }
    else {
        log('Counter found, changing...');
        counters.worldTriggerDays = wtFile.days;
        await counters.save();
        log('Counter changed');
    }
    log('Starting converting %d file ids to posts in mongo', wtFile.queue.length);
    for (const [i, fileId] of wtFile.queue.entries()) {
        log('Converting %d post...', i + 1);
        const post = new everyday_post_1.EverydayPostModel({
            type: 'world trigger',
            fileId
        });
        await post.save();
        log('Converted!');
    }
    await mongoose_1.default.disconnect();
})().catch(console.log);
