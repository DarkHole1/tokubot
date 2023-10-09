"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const dotenv = require("dotenv");
const zod_1 = require("zod");
const RawConfig = zod_1.z.object({
    TOKEN: zod_1.z.string().min(1),
    ERAI_TOKEN: zod_1.z.string().min(1),
    SAGIRI_TOKEN: zod_1.z.string().min(1),
    VK_SERVICE_KEY: zod_1.z.string().min(1),
    MONGODB_URI: zod_1.z.string().min(1)
});
class Config {
    constructor() {
        const config = dotenv.config();
        if (!('parsed' in config) || !config.parsed) {
            throw new Error('No config found');
        }
        const parsed = RawConfig.parse(config.parsed);
        this.TOKEN = parsed.TOKEN;
        this.ERAI_TOKEN = parsed.ERAI_TOKEN;
        this.SAGIRI_TOKEN = parsed.SAGIRI_TOKEN;
        this.VK_SERVICE_KEY = parsed.VK_SERVICE_KEY;
        this.MONGODB_URI = parsed.MONGODB_URI;
    }
}
exports.Config = Config;
