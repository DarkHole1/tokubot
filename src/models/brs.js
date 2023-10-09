"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawBRS = void 0;
const zod_1 = require("zod");
exports.RawBRS = zod_1.z.object({
    days: zod_1.z.number().int(),
    queue: zod_1.z.array(zod_1.z.string())
});
