export enum AccessStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  PENDING = 'PENDING'
}

export interface AccessLog {
  id: string;
  timestamp: number;
  userId: string;
  ipAddress: string;
  action: string;
  status: AccessStatus;
  reason?: string; // Reason for the status (e.g., "Firewall Block", "Invalid Signature")
  signature: string; // Mock cryptographic signature
}

export interface Block {
  index: number;
  timestamp: number;
  data: AccessLog[];
  previousHash: string;
  hash: string;
  nonce: number;
}

export interface UserIdentity {
  id: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'GUEST';
  authorized: boolean;
}

export type ViewState = 'DASHBOARD' | 'BLOCKCHAIN' | 'VERIFY' | 'ML_ANALYSIS';

// Constants used for simulation
export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";