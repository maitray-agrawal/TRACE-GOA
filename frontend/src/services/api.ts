import type { CaseRecord, SubgraphData, LedgerEntry } from "../types";

const API_BASE = "http://localhost:8000/api";

export async function fetchMetrics(): Promise<any> {
  const res = await fetch(`${API_BASE}/metrics`);
  return res.json();
}

export async function fetchCases(status?: string): Promise<CaseRecord[]> {
  const url = status ? `${API_BASE}/investigations?status=${status}` : `${API_BASE}/investigations`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchCase(caseId: string): Promise<CaseRecord> {
  const res = await fetch(`${API_BASE}/investigations/${caseId}`);
  return res.json();
}

export async function runInvestigation(caseId: string, allowStepUp = true, simulateSuccess = true): Promise<any> {
  const res = await fetch(`${API_BASE}/investigations/${caseId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allow_step_up: allowStepUp, simulate_step_up_success: simulateSuccess })
  });
  return res.json();
}

export async function fetchCaseGraph(caseId: string, depth = 2): Promise<SubgraphData> {
  const res = await fetch(`${API_BASE}/investigations/${caseId}/graph?depth=${depth}`);
  return res.json();
}

export async function fetchCaseEvidence(caseId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/investigations/${caseId}/evidence`);
  return res.json();
}

export async function fetchCaseDecisions(caseId: string): Promise<LedgerEntry[]> {
  const res = await fetch(`${API_BASE}/investigations/${caseId}/decisions`);
  return res.json();
}

export async function verifyLedger(caseId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/ledger/verify?case_id=${caseId}`, { method: "POST" });
  return res.json();
}

export async function approveCaseAction(caseId: string, payload: {
  action: string;
  approver_name: string;
  approver_role: string;
  approved: boolean;
  notes?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/investigations/${caseId}/actions/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchCaseMemory(caseId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/investigations/${caseId}/memory`);
  return res.json();
}

export async function fetchPolicies(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/policies`);
  return res.json();
}
