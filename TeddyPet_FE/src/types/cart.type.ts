export interface CartItemResponse {
    variantId: number;
    sku: string;
    productName: string;
    variantName: string;
    featuredImageUrl: string;
    altImage: string;
    price: number;
    salePrice: number | null;
    finalPrice: number;
    quantity: number;
    subTotal: number;
    stockQuantity: number;
    isAvailable: boolean;
}

export interface CartItem {
    id: string | number;
    title: string;
    image: string;
    option: {
        id: string;
        size: string;
        price: number;
        originalPrice?: number;
    };
    quantity: number;
    stockQuantity?: number;
    isAvailable?: boolean;
    checked?: boolean;
}

export interface CartResponse {
    userId: string | number;
    items: CartItemResponse[];
    totalAmount: number;
    totalItems: number;
}

export interface AddToCartRequest {
    variantId: number;
    quantity: number;
}

export interface UpdateCartItemRequest {
    variantId: number;
    quantity: number;
}

export interface CartState {
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
