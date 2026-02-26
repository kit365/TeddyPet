import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { getCart, addToCart as addToCartAPI, updateCartItem as updateCartItemAPI, removeCartItem as removeCartItemAPI, syncGuestCart } from "../api/cart.api";
import { CartItemResponse, CartItem, CartState } from "../types/cart.type";
import Cookies from "js-cookie";

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
    isAvailable: backendItem.isAvailable,
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

                        if (get().isSyncing || (!force && (now - get().lastSync < 2000))) {
                            return;
                        }

                        set({ isSyncing: true });
                        try {
                            let response;
                            if (token) {
                                response = await getCart();
                            } else {
                                // Guest sync: send current local IDs to get latest prices/stock
                                const localItems = get().items.map(i => ({
                                    variantId: Number(i.id),
                                    quantity: i.quantity
                                }));
                                if (localItems.length === 0) {
                                    set({ lastSync: Date.now() });
                                    return;
                                }
                                response = await syncGuestCart(localItems);
                            }

                            if (response.success && response.data) {
                                const backendItems = response.data.items.map(mapBackendToFrontend);

                                // Merge with local checked state
                                const currentItems = get().items;
                                const mergedItems = backendItems.map(bItem => {
                                    const localItem = currentItems.find(lItem => Number(lItem.id) === Number(bItem.id));
                                    return {
                                        ...bItem,
                                        checked: localItem ? (localItem.checked ?? true) : true
                                    };
                                });

                                set({ items: mergedItems, lastSync: Date.now() });
                            }
                        } catch (error) {
                            console.error("Failed to sync cart:", error);
                        } finally {
                            set({ isSyncing: false });
                        }
                    },

                    addToCart: async (item) => {
                        const token = Cookies.get("token");
                        const variantId = Number(item.id);

                        // Optimistic update for all cases
                        set((state) => {
                            const existingIndex = state.items.findIndex(
                                (i) => Number(i.id) === variantId
                            );

                            if (existingIndex !== -1) {
                                state.items[existingIndex].quantity += item.quantity;
                            } else {
                                state.items.push({ ...item, id: variantId, checked: true });
                            }
                        });

                        if (token) {
                            // User logged in: call backend API to persist
                            try {
                                await addToCartAPI({
                                    variantId: variantId,
                                    quantity: item.quantity,
                                });
                                // Sync back from server to ensure data consistency
                                await get().syncWithBackend(true);
                            } catch (error) {
                                console.error("Failed to add to cart on server:", error);
                                // Optional: revert optimistic update or show error
                                throw error;
                            }
                        }
                    },

                    removeFromCart: async (id) => {
                        const token = Cookies.get("token");
                        const variantId = Number(id);

                        // Local update first
                        set((state) => {
                            state.items = state.items.filter((i) => Number(i.id) !== variantId);
                        });

                        if (token) {
                            try {
                                await removeCartItemAPI(variantId);
                                await get().syncWithBackend(true);
                            } catch (error) {
                                console.error("Failed to remove from cart on server:", error);
                            }
                        }
                    },

                    updateQuantity: async (id, quantity) => {
                        const token = Cookies.get("token");
                        const variantId = Number(id);

                        // Local update first
                        set((state) => {
                            const existingIndex = state.items.findIndex((i) => Number(i.id) === variantId);
                            if (quantity <= 0) {
                                if (existingIndex !== -1) state.items.splice(existingIndex, 1);
                            } else if (existingIndex !== -1) {
                                state.items[existingIndex].quantity = quantity;
                            }
                        });

                        if (token) {
                            try {
                                if (quantity <= 0) {
                                    await removeCartItemAPI(variantId);
                                } else {
                                    await updateCartItemAPI({
                                        variantId: variantId,
                                        quantity: quantity,
                                    });
                                }
                                await get().syncWithBackend(true);
                            } catch (error) {
                                console.error("Failed to update cart quantity on server:", error);
                            }
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
                            // Always sync to validate stock/price, regardless of token
                            state.syncWithBackend();
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


