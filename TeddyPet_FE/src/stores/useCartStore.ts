import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface CartItem {
    id: string | number;
    title: string;
    image: string;
    option: {
        id: string;
        size: string;
        price: number;
    };
    quantity: number;
}

interface CartState {
    items: CartItem[];
    isHydrated: boolean;
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string | number) => void;
    updateQuantity: (id: string | number, quantity: number) => void;
    clearCart: () => void;

    totalAmount: () => number;
    totalItems: () => number;
    set: (newState: Partial<CartState>) => void;
}

export const useCartStore = create<CartState>()(
    immer(
        persist(
            (set, get) => ({
                items: [],
                isHydrated: false,

                addToCart: (item) => {
                    set((state) => {
                        const existingIndex = state.items.findIndex(
                            (i: CartItem) => i.id === item.id
                        );

                        if (existingIndex !== -1) {
                            state.items[existingIndex].quantity += item.quantity;
                        } else {
                            state.items.push(item);
                        }
                    });
                },

                removeFromCart: (id) => {
                    set((state) => {
                        state.items = state.items.filter((i) => i.id !== id);
                    });
                },

                updateQuantity: (id, quantity) => {
                    set((state) => {
                        const existingIndex = state.items.findIndex((i) => i.id === id);

                        if (quantity <= 0) {
                            if (existingIndex !== -1) {
                                state.items.splice(existingIndex, 1);
                            }
                        } else if (existingIndex !== -1) {
                            state.items[existingIndex].quantity = quantity;
                        }
                    });
                },

                clearCart: () => set({ items: [] }),

                totalAmount: () =>
                    get().items.reduce(
                        (sum, item) => sum + item.option.price * item.quantity,
                        0
                    ),

                totalItems: () =>
                    get().items.reduce((sum, item) => sum + item.quantity, 0),

                set: set
            }),
            {
                name: "cart-storage",
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        state.set({ isHydrated: true });
                    }
                },
            }
        )
    )
);

// Đồng bộ cache với toàn bộ data
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === 'cart-storage') {
            useCartStore.persist.rehydrate();
        }
    });
}
