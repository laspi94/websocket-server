import { checkApiKey, checkJWT } from "./api";

export const Middlewares = {
    api: [checkApiKey, checkJWT],
    web: []
};