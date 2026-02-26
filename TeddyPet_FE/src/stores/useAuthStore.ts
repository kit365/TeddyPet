import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import Cookies from "js-cookie";
import { AuthState } from "../types/auth.type";

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                user: null,
                token: null,
                isHydrated: false,
                login: (user, token, refreshToken) => {
                    Cookies.set("token", token);
                    if (refreshToken) {
                        Cookies.set("refreshToken", refreshToken);
                    }
                    set({ user, token });
                },
                logout: () => {
                    Cookies.remove("token");
                    Cookies.remove("refreshToken");
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
