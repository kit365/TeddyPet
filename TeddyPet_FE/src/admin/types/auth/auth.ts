// ==================== AUTH REQUEST ====================
export interface LoginRequest {
  email: string;
  password: string;
}

// ==================== AUTH RESPONSE ====================
export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  roleName: string;
  expiresAt: string;
}
