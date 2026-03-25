import { apiApp as axiosClient } from "./index";

export const notificationApi = {
    getMyNotifications: (limit = 20) => {
        return axiosClient.get("/api/notifications", {
            params: { limit }
        }).then(res => res.data.data);
    },
    markAllAsRead: () => {
        return axiosClient.put("/api/notifications/mark-as-read");
    },
    markAsRead: (id: string) => {
        return axiosClient.put(`/api/notifications/mark-as-read/${id}`);
    }
};
