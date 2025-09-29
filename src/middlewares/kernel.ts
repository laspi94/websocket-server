import { checkApiKey } from "./checkApiKey";

export const Middlewares = {
    api: [checkApiKey],
    web: []
};