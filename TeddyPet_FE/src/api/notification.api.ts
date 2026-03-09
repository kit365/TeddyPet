import { apiApp as axiosClient } from "./index";
import { NotificationDTO } from "../stores/useNotificationStore";

export const notificationApi = {
    getMyNotifications: (limit = 20) => {
        return axiosClient.get<NotificationDTO[]>("/api/notifications", {
            params: { limit }
        }).then(res => res.data);
    },
    markAllAsRead: () => {
        return axiosClient.put("/api/notifications/mark-as-read");
    }
};
