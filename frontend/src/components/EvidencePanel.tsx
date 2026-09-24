import React from "react";
import type { CaseRecord } from "../types";
import { EvidenceNoticeBoard } from "./EvidenceNoticeBoard";

interface EvidencePanelProps {
  caseData: CaseRecord | null;
  policies?: any[];
  similarCases?: any[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ caseData, policies = [], similarCases = [] }) => {
  return (
    <EvidenceNoticeBoard
      caseData={caseData}
      policies={policies}
      similarCases={similarCases}
    />
  );
};
