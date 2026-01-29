import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import Cookies from "js-cookie";

interface User {
    id?: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatarUrl?: string;
    altImage?: string;
    gender?: string;
    dateOfBirth?: string;
    status?: string;
    role?: string;
    expiresAt?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isHydrated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    set: (newState: Partial<AuthState>) => void;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                user: null,
                token: null,
                isHydrated: false,
                login: (user, token) => {
                    Cookies.set("token", token);
                    set({ user, token });
                },
                logout: () => {
                    Cookies.remove("token");
                    set({ user: null, token: null });
                },
                set: (newState) => set(newState),
            }),
            {
                name: "auth-storage",
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        state.set({ isHydrated: true });
                    }
                },
            }
        ),
        { name: "AuthStore" }
    )
);

if (import.meta.env.DEV) {
    useAuthStore.subscribe((state) => {
        console.log("Auth Store updated:", state);
    });
}
