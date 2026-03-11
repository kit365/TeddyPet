export interface BookingDepositRefundPolicy {
  id: number;
  policyName: string;
  description?: string | null;
  depositPercentage: number;
  fullRefundHours: number;
  fullRefundPercentage: number;
  partialRefundHours: number;
  partialRefundPercentage: number;
  noRefundHours: number;
  noRefundPercentage: number;
  noShowRefundPercentage: number;
  noShowPenalty: number;
  allowForceMajeure: boolean;
  forceMajeureRefundPercentage: number;
  forceMajeureRequiresEvidence: boolean;
  isDefault: boolean;
  displayOrder: number;
  highlightText?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

