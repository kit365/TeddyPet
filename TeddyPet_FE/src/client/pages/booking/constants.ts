/** Time slots for per_session booking (8:00 - 17:00, every 30 min) */
export const SESSION_SLOTS = (() => {
    const slots: string[] = [];
    for (let h = 8; h <= 17; h++) {
        for (const m of [0, 30]) {
            if (h === 17 && m === 30) break;
            slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
        }
    }
    return slots;
})();

export const PET_TYPES = [
    { value: "dog", label: "Chó" },
    { value: "cat", label: "Mèo" },
    { value: "other", label: "Khác" },
] as const;

/** Loại thức ăn mang theo (map sang PetFoodBrought.foodBroughtType) */
export const FOOD_TYPE_OPTIONS = [
    { value: "hat", label: "Hạt" },
    { value: "sup_thuong", label: "Súp thưởng" },
    { value: "pate", label: "Pate" },
    { value: "khac", label: "Khác" },
] as const;
