import { useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import { useNotificationStore, NotificationDTO } from '../../stores/useNotificationStore';
import { useAuthStore } from '../../stores/useAuthStore';

// GLOBAL STATE - Persists across all component mounts/unmounts
let globalStompClient: Client | null = null;
let connectedUsername: string | null = null;
const processedMessageIds = new Set<string>();
const recentFingerprints = new Map<string, number>(); // fingerprint -> timestamp

// We need a way to call the LATEST state/actions from a static global callback
const globalRefs = {
    addNotification: (_n: NotificationDTO) => { },
    navigate: (_url: string) => { }
};

export const useAdminNotification = (autoConnect = true) => {
    const navigate = useNavigate();
    const { addNotification, setNotifications } = useNotificationStore();
    const { user } = useAuthStore();

    // Fetch initial notifications on mount/user change
    useEffect(() => {
        if (!user?.username) return;

        import('../../api/notification.api').then(({ notificationApi }) => {
            notificationApi.getMyNotifications(30).then(data => {
                setNotifications(data);
                // Mark IDs as processed to avoid toast alerts for old messages
                data.forEach(n => processedMessageIds.add(n.id));
            });
        });
    }, [user?.username, setNotifications]);

    // Update global refs on every render/mount so the static callback always has the latest versions
    useEffect(() => {
        globalRefs.addNotification = addNotification;
        globalRefs.navigate = navigate;
    }, [addNotification, navigate]);

    const showPremiumToast = useCallback((notification: NotificationDTO) => {
        // 1. Duplicate check (ID based)
        if (processedMessageIds.has(notification.id)) return;
        processedMessageIds.add(notification.id);

        // 2. Fingerprint check (Content based deduplication for simultaneous Admin/User alerts)
        const fingerprint = `${notification.title}|${notification.message}|${notification.targetUrl}`;
        const now = Date.now();
        const lastSeen = recentFingerprints.get(fingerprint);

        // If we saw the exact same message in the last 2 seconds, skip it
        if (lastSeen && now - lastSeen < 2000) {
            console.log("🛡️ Suppressing redundant notification alert (fingerprint match)");
            return;
        }
        recentFingerprints.set(fingerprint, now);

        // Cleanup old fingerprints every fixed interval
        if (recentFingerprints.size > 50) {
            for (const [fp, time] of recentFingerprints.entries()) {
                if (now - time > 10000) recentFingerprints.delete(fp);
            }
        }

        // 3. Add to store
        globalRefs.addNotification(notification);

        // 3. Sound effect (Premium Notification Sound)
        try {
            const audio = new Audio('https://raw.githubusercontent.com/Shashwat-Pragya/Notification-Sounds/master/notification-sound.mp3');
            audio.volume = 0.5;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Browser blocked notification audio. User must interact with the page first.", error);
                });
            }
        } catch (e) {
            console.error('Audio play failed', e);
        }

        // 4. Identify type for styling
        const isClientType = notification.type.includes('CUSTOMER') ||
            notification.type.includes('REPLIED') ||
            notification.type.includes('STATUS');

        toast(
            <div className="flex flex-col gap-4 p-2 pointer-events-auto min-w-[320px] relative font-sans">
                <div className="flex items-start gap-4">
                    {/* Icon Section */}
                    <div className="flex-shrink-0 relative">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-500 hover:scale-110 ${isClientType
                            ? 'bg-gradient-to-br from-[#ff9a9a] to-[#ff6262]'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            }`}>
                            {isClientType ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            )}
                        </div>
                        {/* Admin Badge */}
                        {!isClientType && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white animate-bounce shadow-sm" />
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                            <h4 className="text-[16px] font-extrabold text-gray-900 tracking-tight leading-none">
                                {notification.title}
                            </h4>
                        </div>
                        <p className="text-[13px] text-gray-500 leading-snug font-medium pr-2">
                            {notification.message}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 mt-1 pt-3 border-t border-gray-50">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.dismiss();
                        }}
                        className="px-4 py-2 text-[12px] font-bold text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        {isClientType ? 'Đã hiểu' : 'Bỏ qua'}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (notification.targetUrl) {
                                globalRefs.navigate(notification.targetUrl);
                            }
                            toast.dismiss();
                        }}
                        className={`px-6 py-2.5 text-white text-[12px] font-extrabold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${isClientType
                            ? 'bg-[#ff6262] hover:bg-[#ff4d4d] shadow-red-100'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                            }`}
                    >
                        {isClientType ? 'Xem ngay' : 'Kiểm tra'}
                    </button>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .Toastify__toast {
                        border-radius: 24px !important;
                        padding: 16px 20px !important;
                        background: #ffffff !important;
                        border: 1px solid #f3f4f6 !important;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12) !important;
                    }
                    .Toastify__toast-body {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .Toastify__close-button {
                        display: none !important;
                    }
                    .Toastify__toast-container--top-right {
                        top: 100px !important;
                        right: 40px !important;
                    }
                `}} />
            </div>,
            {
                position: "top-right",
                autoClose: isClientType ? 6000 : 12000,
                hideProgressBar: !isClientType,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            }
        );
    }, []);

    const connect = useCallback(() => {
        // If client is already connected to the CORRECT user, do nothing
        if (globalStompClient?.connected && connectedUsername === user?.username) {
            return;
        }

        // Clean up old client if it exists (either disconnected or wrong user)
        if (globalStompClient) {
            console.log(` Deactivating WebSocket client (Connected User: ${connectedUsername}, Current User: ${user?.username})`);
            globalStompClient.deactivate();
            globalStompClient = null;
            connectedUsername = null;
        }

        if (!user?.username) return;

        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const socketUrl = `${apiBase}/ws`;
        const client = new Client({
            brokerURL: socketUrl.replace('http', 'ws'),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log(`✅ WebSocket Connected for: ${user.username}`);
                connectedUsername = user.username;

                const roleObj = user.role;
                const roleName = (typeof roleObj === 'object' && roleObj !== null && 'name' in roleObj)
                    ? (roleObj as any).name
                    : String(roleObj);
                const isStaff = roleName === "ADMIN" || roleName === "STAFF";

                // 1. Private Queue for this specific user
                const privateQueue = `/user/${user.username}/queue/notifications`;
                client.subscribe(privateQueue, (message) => {
                    try {
                        const notification: NotificationDTO = JSON.parse(message.body);

                        // STRICT DEDUPLICATION: Only process if we haven't seen this specific ID
                        if (notification.id && processedMessageIds.has(notification.id)) {
                            console.log("� Skipping duplicate notification ID:", notification.id);
                            return;
                        }
                        if (notification.id) processedMessageIds.add(notification.id);

                        globalRefs.addNotification(notification);
                        showPremiumToast(notification);
                    } catch (e) {
                        console.error("Error parsing private message", e);
                    }
                });
                console.log(`✅ Subscribed to private queue: ${privateQueue}`);

                // 2. Admin Topic (only for staff)
                if (isStaff) {
                    client.subscribe('/topic/admin-orders', (message) => {
                        try {
                            const notification: NotificationDTO = JSON.parse(message.body);

                            // Check deduplication again for topic messages
                            if (notification.id && processedMessageIds.has(notification.id)) {
                                console.log("🚫 Skipping duplicate admin notification ID:", notification.id);
                                return;
                            }
                            if (notification.id) processedMessageIds.add(notification.id);

                            globalRefs.addNotification(notification);
                            showPremiumToast(notification);
                        } catch (e) {
                            console.error("Error parsing admin message", e);
                        }
                    });
                    console.log(`✅ Subscribed to Admin orders topic`);
                }
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();
        globalStompClient = client;
    }, [user, showPremiumToast]); // Added showPremiumToast to dependencies

    useEffect(() => {
        if (!autoConnect) return;
        connect();

        // Cleanup function for WebSocket client
        return () => {
            if (globalStompClient && globalStompClient.connected) {
                console.log('🔌 Deactivating WebSocket client on unmount/dependency change.');
                globalStompClient.deactivate();
                globalStompClient = null;
                connectedUsername = null;
            }
        };
    }, [connect, autoConnect]);

    return { notifications: useNotificationStore(state => state.notifications) };
};
