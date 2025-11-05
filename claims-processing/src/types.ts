export type Status = "unpaid" | "paid" | "overdue" | null;
export type Category =
  | "cleaning" | "rekey" | "landscaping" | "unpaid_utilities" | "unpaid_rent"
  | "lease_break_fee" | "prorated_rent" | "painting" | "carpet" | "flooring"
  | "repair" | "pet_damage" | "non_refundable_fee" | "lawn_service_unoccupied"
  | "other" | null;
export type Wear = "normal_wear_and_tear" | "beyond_normal_wear_and_tear" | null;

export interface DocPresence {
  leaseAgreement: boolean;
  leaseAddendum: boolean;
  notificationToTenant: boolean;
  tenantLedger: boolean;
}

export interface ChargeItem {
  date: string | null;
  description: string;
  amount: number;
  status: Status;
  category: Category;
  wearClassification: Wear;
  evidence?: string;
  occupancyLink?: string| null;
}

export interface LedgerValidation {
  firstMonthRentPaid: boolean | null;
  firstMonthRentEvidence: string | null;
  firstMonthSdiPaid: boolean | null;
  firstMonthSdiEvidence: string | null;
}

export interface NotificationBlock {
  present: boolean | null;
  date: string | null;
  evidence: string | null;
}

export interface ExtractedPayload {
  tenantName?: string | null;
  propertyAddress?: string | null;
  docPresence: DocPresence;
  monthlyRent: number | null;
  maximumBenefit: number | null;
  ledgerValidation: LedgerValidation;
  charges: ChargeItem[];
  notification: NotificationBlock;
}

export interface EvaluationResponse {
  firstMonthPaid: boolean;
  firstMonthPaidEvidence: string | null;
  firstMonthSdiPremiumPaid: boolean;
  firstMonthSdiPremiumPaidEvidence: string | null;
  missingDocuments: string[];
  status: "Approved" | "Declined";
  summaryOfDecision: string;

  approvedCharges?: { description: string; amount: number; reason: string }[];
  excludedCharges?: { description: string; amount: number; reason: string }[];
  totalApprovedCharges?: number;
  finalPayoutBasedOnCoverage?: number;
}
