import { fetchClient } from "./client";

export const subscribeAlarms = () => {

    const result = new EventSource(`http://localhost:8080/api/v1/notifications/subscribe`, { withCredentials: true });

    return result;
}

export const getAlarmStatus = async () => {
    const result = await fetchClient(`notifications/status`);

    return result;
}

export const getAlarms = async ({ cursorId, category, read }: { cursorId?: number; category?: string; read?: boolean; } = {}) => {
    const params = new URLSearchParams();
    
    if (cursorId !== undefined) params.append('cursorId', String(cursorId));
    if (category !== undefined) params.append('size', String(category));
    if (read !== undefined) params.append('size', String(read));

    const query = params.toString();
    const result = await fetchClient(`notifications${query ? `?${query}` : ''}`);

    return result;
}
