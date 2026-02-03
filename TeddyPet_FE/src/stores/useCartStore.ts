import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { getCart, addToCart as addToCartAPI, updateCartItem as updateCartItemAPI, removeCartItem as removeCartItemAPI } from "../api/cart.api";
import { CartItemResponse, CartItem } from "../types/cart.type";
import Cookies from "js-cookie";

interface CartState {
    items: CartItem[];
    isHydrated: boolean;
    isSyncing: boolean;
    lastSync: number; // Timestamp of last sync

    // Sync with backend
    syncWithBackend: (force?: boolean) => Promise<void>;

    // Cart actions
    addToCart: (item: CartItem) => Promise<void>;
    removeFromCart: (id: string | number) => Promise<void>;
    updateQuantity: (id: string | number, quantity: number) => Promise<void>;
    clearCart: () => void;
    toggleCheck: (id: string | number) => void;
    toggleAll: (checked: boolean) => void;

    buyNowItem: CartItem | null;
    setBuyNowItem: (item: CartItem | null) => void;

    totalAmount: () => number;
    totalAmountChecked: () => number;
    totalItems: () => number;
    totalItemsChecked: () => number;
    set: (newState: Partial<CartState>) => void;
}

// Helper: Convert backend CartItemResponse to frontend CartItem
const mapBackendToFrontend = (backendItem: CartItemResponse): CartItem => ({
    id: backendItem.variantId,
    title: backendItem.productName,
    image: backendItem.featuredImageUrl || "",
    option: {
        id: String(backendItem.variantId),
        size: backendItem.variantName,
        price: backendItem.finalPrice,
        originalPrice: backendItem.salePrice ? backendItem.price : undefined,
    },
    quantity: backendItem.quantity,
    stockQuantity: backendItem.stockQuantity,
    checked: true,
});

export const useCartStore = create<CartState>()(
    devtools(
        immer(
            persist(
                (set, get) => ({
                    items: [],
                    isHydrated: false,
                    isSyncing: false,
                    lastSync: 0,

                    // Sync cart from backend
                    syncWithBackend: async (force = false) => {
                        const token = Cookies.get("token");
                        const now = Date.now();
                        // Prevent sync if not logged in, already syncing, or synced very recently (e.g. within 2 seconds) unless forced
                        if (!token || get().isSyncing || (!force && (now - get().lastSync < 2000))) {
                            return;
                        }

                        set({ isSyncing: true });
                        try {
                            const response = await getCart();
                            if (response.success && response.data) {
                                const backendItems = response.data.items.map(mapBackendToFrontend);

                                // Merge with local checked state
                                const currentItems = get().items;
                                const mergedItems = backendItems.map(bItem => {
                                    const localItem = currentItems.find(lItem => lItem.id === bItem.id);
                                    return {
                                        ...bItem,
                                        checked: localItem ? (localItem.checked ?? true) : true
                                    };
                                });

                                set({ items: mergedItems, lastSync: Date.now() });
                            }
                        } catch (error) {
                            console.error("Failed to sync cart from backend:", error);
                        } finally {
                            set({ isSyncing: false });
                        }
                    },

                    addToCart: async (item) => {
                        const token = Cookies.get("token");

                        if (token) {
                            // User logged in: call backend API
                            try {
                                await addToCartAPI({
                                    variantId: Number(item.id),
                                    quantity: item.quantity,
                                });
                                // Sync after adding (force sync)
                                await get().syncWithBackend(true);
                            } catch (error) {
                                console.error("Failed to add to cart:", error);
                                throw error;
                            }
                        } else {
                            // User not logged in: local storage only
                            set((state) => {
                                const existingIndex = state.items.findIndex(
                                    (i: CartItem) => i.id === item.id
                                );

                                if (existingIndex !== -1) {
                                    state.items[existingIndex].quantity += item.quantity;
                                } else {
                                    state.items.push({ ...item, checked: true });
                                }
                            });
                        }
                    },

                    removeFromCart: async (id) => {
                        const token = Cookies.get("token");

                        if (token) {
                            // User logged in: call backend API
                            try {
                                await removeCartItemAPI(Number(id));
                                // Sync after removing (force sync)
                                await get().syncWithBackend(true);
                            } catch (error) {
                                console.error("Failed to remove from cart:", error);
                                throw error;
                            }
                        } else {
                            // User not logged in: local storage only
                            set((state) => {
                                state.items = state.items.filter((i) => i.id !== id);
                            });
                        }
                    },

                    updateQuantity: async (id, quantity) => {
                        const token = Cookies.get("token");

                        if (token) {
                            // User logged in: call backend API
                            try {
                                if (quantity <= 0) {
                                    await removeCartItemAPI(Number(id));
                                } else {
                                    await updateCartItemAPI({
                                        variantId: Number(id),
                                        quantity: quantity,
                                    });
                                }
                                // Sync after updating (force sync)
                                await get().syncWithBackend(true);
                            } catch (error) {
                                console.error("Failed to update cart quantity:", error);
                                throw error;
                            }
                        } else {
                            // User not logged in: local storage only
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
                        }
                    },

                    clearCart: () => set({ items: [] }),

                    toggleCheck: (id) =>
                        set((state) => {
                            const item = state.items.find((i) => i.id === id);
                            if (item) {
                                item.checked = !item.checked;
                            }
                        }),

                    toggleAll: (checked) =>
                        set((state) => {
                            state.items.forEach((item) => {
                                item.checked = checked;
                            });
                        }),

                    totalAmount: () =>
                        get().items.reduce(
                            (sum, item) => {
                                if (!item?.option?.price) return sum;
                                return sum + item.option.price * item.quantity;
                            },
                            0
                        ),

                    totalAmountChecked: () =>
                        get().items.reduce(
                            (sum, item) => {
                                if (!item?.option?.price || !item.checked) return sum;
                                return sum + item.option.price * item.quantity;
                            },
                            0
                        ),

                    totalItems: () =>
                        get().items.reduce((sum, item) => sum + item.quantity, 0),

                    totalItemsChecked: () =>
                        get().items.reduce((sum, item) => item.checked ? sum + item.quantity : sum, 0),

                    buyNowItem: null,
                    setBuyNowItem: (item) => set({ buyNowItem: item }),

                    set: set
                }),
                {
                    name: "cart-storage",
                    onRehydrateStorage: () => (state) => {
                        if (state) {
                            state.set({ isHydrated: true });
                            // Auto-sync with backend after hydration if user is logged in
                            const token = Cookies.get("token");
                            if (token) {
                                state.syncWithBackend();
                            }
                        }
                    },
                }
            )
        ),
        { name: "CartStore" }
    )
);

// Expose store for debugging in console/devtool
if (typeof window !== "undefined") {
    (window as any).cartStore = useCartStore;
}


