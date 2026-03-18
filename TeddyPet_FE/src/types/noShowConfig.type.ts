export interface NoShowConfig {
  id?: number;
  gracePeriodMinutes: number;
  autoMarkNoShow: boolean;
  forfeitDeposit: boolean;
  penaltyAmount: number;
  allowLateCheckin: boolean;
  lateCheckinMinutes: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

