export type PetTypeEnum = "DOG" | "CAT" | "OTHER";
export type GenderEnum = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export interface PetProfileRequest {
    name: string;
    petType: PetTypeEnum;
    breed?: string;
    gender?: GenderEnum;
    birthDate?: string; // ISO date
    weight?: number;
    avatarUrl?: string;
    isNeutered?: boolean;
    healthNote?: string;
}

export interface PetProfileResponse {
    id: number;
    userId: string;
    name: string;
    petType: PetTypeEnum;
    breed?: string;
    gender?: GenderEnum;
    birthDate?: string;
    weight?: number;
    avatarUrl?: string;
    isNeutered?: boolean;
    healthNote?: string;
}
