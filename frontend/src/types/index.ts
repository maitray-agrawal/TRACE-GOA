export type CaseStatus =
  | "NEW"
  | "INVESTIGATING"
  | "AWAITING_EVIDENCE"
  | "REASSESSMENT"
  | "ACTION_PENDING"
  | "AWAITING_APPROVAL"
  | "ACTION_EXECUTED"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type ActionType =
  | "ALLOW_TRANSACTION"
  | "BLOCK_TRANSACTION"
  | "MONITOR_TRANSACTION"
  | "BLOCK_ACCOUNT"
  | "MONITOR_ACCOUNT"
  | "WARN_CUSTOMER"
  | "CREATE_CASE"
  | "REQUEST_MORE_EVIDENCE"
  | "REQUEST_CUSTOMER_VALIDATION"
  | "REQUEST_STEP_UP_AUTH"
  | "ESCALATE_TO_ANALYST"
  | "FILE_REPORT";

export type ApprovalRole = "NONE" | "ANALYST" | "SENIOR_ANALYST" | "FRAUD_MANAGER";

export interface EvidenceItem {
  id: string;
  source: string;
  direction: "SUPPORTING" | "CONTRADICTING" | "MISSING";
  title: string;
  details: Record<string, any>;
  weight: number;
  timestamp: number;
}

export interface RecommendedAction {
  action: ActionType;
  priority: string;
  confidence: number;
  reason: string;
  supporting_evidence: string[];
  policy_basis: string[];
  approval_required: boolean;
  approval_route: ApprovalRole;
  execution_status: string;
}

export interface CaseRecord {
  case_id: string;
  trigger_txn_id: string;
  subject_customer_id: string;
  status: CaseStatus;
  risk_score: number;
  confidence: number;
  fraud_patterns: string[];
  supporting_evidence: EvidenceItem[];
  contradicting_evidence: EvidenceItem[];
  missing_evidence: string[];
  uncertainty_level: string;
  findings: string[];
  recommended_actions: RecommendedAction[];
  executed_actions: Array<Record<string, any>>;
  approvals: Array<Record<string, any>>;
  investigator: string;
  final_outcome?: string;
  created_at: number;
  updated_at: number;
}

export interface GraphNode {
  id: string;
  type: string;
  attributes: Record<string, any>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  source_type: string;
  target: string;
  target_type: string;
  type: string;
  attributes: Record<string, any>;
}

export interface SubgraphData {
  target_transaction: string;
  depth: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  node_count: number;
  edge_count: number;
}

export interface TimelineStep {
  step_name: string;
  status: string;
  details: string;
  timestamp: number;
  time_str: string;
}

export interface LedgerEntry {
  entry_id: number;
  case_id: string;
  timestamp: number;
  actor: string;
  event_type: string;
  input_data: string;
  decision?: string;
  reason?: string;
  confidence?: number;
  previous_hash: string;
  current_hash: string;
}
