import type { NEED_STATUS, STRUCTURE_STATUS, ROLES } from "./referentials";

export type Role = keyof typeof ROLES;
export type NeedStatus = keyof typeof NEED_STATUS;
export type StructureStatus = keyof typeof STRUCTURE_STATUS;

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: "pending" | "active" | "suspended";
  emailVerified: boolean;
  structureId?: string | null;
  failedLogins: number;
  lockedUntil?: string | null;
  tokenVersion: number;
  createdAt: string;
  lastLoginAt?: string | null;
  // Fiche responsable (annexe C.2)
  civility?: string;
  lastName: string;
  postName?: string;
  firstName: string;
  title?: string;
  department?: string;
  startDate?: string;
  phone?: string;
  whatsapp?: string;
  postStatus?: string;
  itTeamSize?: number | null;
  deputyName?: string;
  deputyContact?: string;
  consentPublish?: boolean;
  consentAt?: string | null;
  demo?: boolean;
}

export interface Structure {
  id: string;
  name: string;
  acronym?: string;
  typeCode: string;
  tutelle?: string;
  province: string;
  city: string;
  address?: string;
  email: string;
  phone?: string;
  website?: string;
  staff?: number | null;
  sites?: number | null;
  itUsers?: number | null;
  status: StructureStatus;
  ownerId?: string | null;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
  isNewRequest?: boolean; // structure absente du référentiel (EF-STR-08)
  demo?: boolean;
}

export interface AiProposal {
  category: string;
  confidence: number;
  model: string;
  engine: "llm" | "local";
  rationale?: string;
  at: string;
  decision?: "accepted" | "corrected" | "rejected" | null;
  decidedBy?: string | null;
}

export interface Need {
  id: string;
  ref: string;
  structureId: string;
  authorId: string;
  title: string;
  categoryCode: string;
  subcategory?: string;
  otherCategory?: string;
  description: string;
  justification?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  totalOverrideReason?: string;
  currency: "USD" | "CDF";
  costNature?: string;
  priority: string;
  horizon?: string;
  beneficiaries?: number | null;
  mutualisable?: boolean;
  status: NeedStatus;
  rateApplied?: number | null; // CDF pour 1 USD, figé à la soumission (RG5)
  amountUsd?: number | null;
  submittedAt?: string | null;
  reviewComment?: string;
  internalNote?: string;
  ai?: AiProposal | null;
  createdAt: string;
  updatedAt: string;
  demo?: boolean;
}

export interface Submission {
  id: string;
  ref: string;
  structureId: string;
  userId: string;
  needIds: string[];
  totalUsd: number;
  at: string;
}

export interface Settings {
  id: "global";
  rateCdfPerUsd: number;
  campaignName: string;
  campaignStart: string;
  campaignEnd: string;
  publicCounters: boolean;
  campaignLocked: boolean;
  aiConfidenceThreshold: number;
  infoBanner?: string;
  seeded?: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  userId?: string | null;
  email?: string | null;
  action: string;
  object?: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

export interface Token {
  id: string; // hash du jeton
  kind: "verify" | "reset";
  userId: string;
  codeHash?: string;
  expiresAt: string;
  attempts: number;
}
