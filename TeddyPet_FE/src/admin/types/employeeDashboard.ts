export type EmployeeRole = "CARE" | "SPA";

export type EmployeeGlobalStatus = "READY" | "BUSY" | "OFF";

export interface EmployeeUser {
    id: number | string;
    fullName: string;
    avatarUrl?: string | null;
    positionName?: string | null;
    role: EmployeeRole;
    employmentType: "FULL_TIME" | "PART_TIME";
    todayCheckedIn: boolean;
    globalStatus: EmployeeGlobalStatus;
}

export type TaskBaseStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface BaseTask {
    id: number | string;
    title: string;
    description?: string | null;
    status: TaskBaseStatus;
    createdAt: string;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
}

export interface CareTask extends BaseTask {
    type: "CARE";
    cageNumber: string;
    petName: string;
    petSpecies: string;
    notes?: string | null;
}

export interface SpaTask extends BaseTask {
    type: "SPA";
    petName: string;
    petSpecies: string;
    serviceType: "SHOWER" | "HAIRCUT" | "NAIL" | "COMBO";
    bookingTime: string;
    durationMinutes: number;
}

export type EmployeeTask = CareTask | SpaTask;

