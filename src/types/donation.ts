export interface DonationInfo {
  transactionId: string;
  amount: number;
  status: string;
  payerEmail: string;
}

export interface DonationResponse {
  success: boolean;
  message?: string;
  error?: string;
} 