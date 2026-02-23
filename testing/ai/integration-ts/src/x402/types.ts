export interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
}

export interface PaymentRequirementsResponse {
  paymentRequirements: PaymentRequirement;
}

export interface PaymentHeader {
  version: string;
  scheme: string;
  network: string;
  payload: string;
  resource: string;
  amount: string;
  signature: string;
}
