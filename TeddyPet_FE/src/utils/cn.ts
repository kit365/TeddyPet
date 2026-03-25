export type ClassValue = string | number | boolean | null | undefined;

export function cn(...inputs: ClassValue[]): string {
    return inputs
        .filter((value) => {
            if (value === null || value === undefined || value === false) return false;
            return String(value).trim().length > 0;
        })
        .map((value) => String(value).trim())
        .join(" ");
}

