import { serverFetchClient } from "./server";

export const getAlarmStatus = async () => {
    const result = await serverFetchClient(`notifications/status`);

    return result;
}