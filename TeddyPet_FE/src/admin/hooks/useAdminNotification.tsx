import { useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { toast } from "react-toastify";
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore, NotificationDTO } from '../../stores/useNotificationStore';
import { useAuthStore } from '../../stores/useAuthStore';

// GLOBAL STATE - Persists across all component mounts/unmounts
let globalStompClient: Client | null = null;
let connectedUsername: string | null = null;
let isCurrentlyAdminConnection = false;
const processedMessageIds = new Set<string>();
const recentFingerprints = new Map<string, number>(); // fingerprint -> timestamp

// We need a way to call the LATEST state/actions from a static global callback
const globalRefs = {
    addNotification: (_n: NotificationDTO) => { },
    navigate: (_url: string) => { }
};

export const useAdminNotification = (autoConnect = true) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isAdminPath = pathname.startsWith('/admin');
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
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3');
            audio.volume = 0.4;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => { });
            }
        } catch (e) { }

        // 4. Identify if we should use Client or Admin styling
        // If we are on the client side, we always use the client (red) theme
        // If on admin side, we check the notification type
        const isClientSidebar = !isAdminPath;
        const isClientType = isClientSidebar || 
            notification.type?.includes('CUSTOMER') ||
            notification.type?.includes('REPLIED') ||
            notification.type?.includes('STATUS');

        console.log("🚀 Showing Toast - Title:", notification.title);

        // Use basic toast() with icon: false to avoid "i" Info icon or other defaults
        toast(
            <div className="flex flex-col w-full pointer-events-auto relative group">
                <div className="flex items-center gap-5 p-5">
                    {/* Icon Section - Glassmorphism style */}
                    <div className="flex-shrink-0 relative">
                        <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 transition-all duration-700 group-hover:rotate-6 group-hover:scale-110 ${isClientType
                            ? 'bg-gradient-to-br from-[#ff9a9a] to-client-primary'
                            : 'bg-gradient-to-br from-indigo-500 to-violet-700'
                            }`}>
                            {isClientType ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            ) : (
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400"></span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className={`text-[0.6875rem] font-black uppercase tracking-[0.15em] ${isClientType ? 'text-client-primary' : 'text-indigo-600'}`}>
                                {isClientSidebar ? 'TeddyPet' : (isClientType ? 'Khách hàng' : 'Hệ thống Admin')}
                            </span>
                            <span className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Vừa xong</span>
                        </div>
                        <h4 className="text-[1.125rem] font-black text-slate-800 tracking-tight leading-none italic">
                            {notification.title}
                        </h4>
                        <p className="text-[0.875rem] text-slate-500 leading-relaxed font-medium line-clamp-2">
                            {notification.message}
                        </p>
                    </div>
                </div>

                {/* Bottom Actions - More discrete and premium */}
                <div className="flex items-center gap-0 border-t border-slate-50 overflow-hidden rounded-b-2xl">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.dismiss();
                        }}
                        className="flex-1 py-4 text-[0.8125rem] font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border-r border-slate-50 uppercase tracking-widest"
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
                        className={`flex-[1.5] py-4 text-white text-[0.8125rem] font-black transition-all uppercase tracking-widest relative overflow-hidden group/btn ${isClientType
                            ? 'bg-client-primary hover:bg-client-secondary'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        <span className="relative z-10">{isClientType ? 'Xem chi tiết' : 'Kiểm tra ngay'}</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .Toastify__toast-container {
                        z-index: 10000 !important;
                        width: 440px !important;
                        padding: 0 !important;
                    }
                    .Toastify__toast-premium {
                        border-radius: 24px !important;
                        padding: 0 !important;
                        background: rgba(255, 255, 255, 0.95) !important;
                        backdrop-filter: blur(12px) !important;
                        border: 1px solid rgba(255, 255, 255, 0.6) !important;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important;
                        overflow: visible !important;
                        margin-bottom: 20px !important;
                        animation: toast-slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    @keyframes toast-slide-in {
                        from { transform: translateX(100%) scale(0.9); opacity: 0; }
                        to { transform: translateX(0) scale(1); opacity: 1; }
                    }
                    .Toastify__toast-body {
                        padding: 0 !important;
                        margin: 0 !important;
                        font-family: 'Lora', serif !important;
                    }
                    .Toastify__close-button {
                        display: none !important;
                    }
                    .Toastify__toast-container--top-right {
                        top: 40px !important;
                        right: 40px !important;
                    }
                `}} />
            </div>,
            {
                icon: false,
                position: "top-right",
                autoClose: isClientType ? 6000 : 12000,
                hideProgressBar: !isClientType,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                className: 'Toastify__toast-premium'
            }
        );
    }, []);

    const connect = useCallback(() => {
        // If client is already connected to the CORRECT user AND correct path mode, do nothing
        if (globalStompClient?.connected && connectedUsername === user?.username && isCurrentlyAdminConnection === isAdminPath) {
            return;
        }

        // Clean up old client if it exists (either disconnected or wrong user)
        if (globalStompClient) {
            console.log(` Deactivating WebSocket client (Connected User: ${connectedUsername}, Current User: ${user?.username})`);
            globalStompClient.deactivate();
            globalStompClient = null;
            connectedUsername = null;
            isCurrentlyAdminConnection = false;
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
                console.log(`✅ WebSocket Connected for: ${user.username} (AdminMode: ${isAdminPath})`);
                connectedUsername = user.username;
                isCurrentlyAdminConnection = isAdminPath;

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
                        console.log("📨 [Private] Notification received:", notification);

                        // STRICT DEDUPLICATION: Only process if we haven't seen this specific ID
                        // Note: If id is null, we always show it
                        if (notification.id && processedMessageIds.has(notification.id)) {
                            console.log("🚫 [Private] Skipping duplicate ID:", notification.id);
                            return;
                        }
                        // We DON'T add to processedMessageIds here, let showPremiumToast do it
                        // so it doesn't return early.

                        showPremiumToast(notification);
                    } catch (e) {
                        console.error("Error parsing private message", e);
                    }
                });
                console.log(`✅ Subscribed to private queue: ${privateQueue}`);

                // 2. Admin Topic (only for staff AND only when on Admin side)
                if (isStaff && isAdminPath) {
                    client.subscribe('/topic/admin-orders', (message) => {
                        try {
                            const notification: NotificationDTO = JSON.parse(message.body);
                            console.log("📨 [Admin-Topic] Notification received:", notification);

                            // Check deduplication again for topic messages
                            if (notification.id && processedMessageIds.has(notification.id)) {
                                console.log("🚫 [Admin-Topic] Skipping duplicate ID:", notification.id);
                                return;
                            }
                            // Don't add to processedMessageIds yet

                            showPremiumToast(notification);

                            // Emit global event to refresh order lists if relevant
                            if (notification.type === 'NEW_ORDER' ||
                                notification.type === 'PAYMENT_SUCCESS' ||
                                notification.type === 'ORDER_CREATED') {
                                console.log("🔄 Triggering REFRESH_ADMIN_ORDERS event");
                                window.dispatchEvent(new CustomEvent('REFRESH_ADMIN_ORDERS'));
                            }
                        } catch (e) {
                            console.error("Error parsing admin message", e);
                        }
                    });
                    console.log(`✅ Subscribed to Admin orders topic`);

                    // 3. Role-based Dashboard Topics
                    const isAdmin = roleName === "ADMIN";
                    const dashboardTopic = isAdmin ? '/topic/dashboard/stats' : '/topic/dashboard/staff-stats';
                    const dashboardEvent = isAdmin ? 'DASHBOARD_STATS_UPDATED' : 'STAFF_DASHBOARD_STATS_UPDATED';

                    client.subscribe(dashboardTopic, (message) => {
                        try {
                            const stats = JSON.parse(message.body);
                            console.log(`📨 [Dashboard-Topic] Stats received from ${dashboardTopic}:`, stats);
                            window.dispatchEvent(new CustomEvent(dashboardEvent, { detail: stats }));
                        } catch (e) {
                            console.error("Error parsing dashboard stats", e);
                        }
                    });
                    console.log(`✅ Subscribed to Dashboard topic: ${dashboardTopic}`);
                }
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });
        client.activate();
        globalStompClient = client;
    }, [user, showPremiumToast, isAdminPath]); // Added isAdminPath to dependencies

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
