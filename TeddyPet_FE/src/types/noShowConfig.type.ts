export interface NoShowServiceSummary {
  id: number;
  code: string;
  serviceName: string;
}

export interface NoShowConfig {
  id?: number;
  name: string;
  gracePeriodMinutes: number;
  autoMarkNoShow: boolean;
  penaltyAmount: number;
  allowLateCheckin: boolean;
  lateCheckinMinutes: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Chi tiết mới có đầy đủ; danh sách có thể rỗng */
  services?: NoShowServiceSummary[];
  /** Số dịch vụ đã gán (API danh sách) */
  linkedServiceCount?: number;
}
