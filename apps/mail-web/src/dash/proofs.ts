import type { FlowProofRecord, FlowSourceOfTruthSnapshot, ProofKind, ProofStatus } from "@iai/mail-core";

export interface ProofsDashModel {
  byKind: Record<ProofKind, number>;
  byStatus: Record<ProofStatus, number>;
  failedProofs: FlowProofRecord[];
  lowConfidenceProofs: FlowProofRecord[];
  verificationRate: number;
}

export function buildProofsDash(
  snapshot: FlowSourceOfTruthSnapshot,
  minimumConfidence = 0.8
): ProofsDashModel {
  const byKind: Record<ProofKind, number> = {
    approval: 0,
    audit: 0,
    execution: 0,
    relay: 0
  };
  const byStatus: Record<ProofStatus, number> = {
    failed: 0,
    pending: 0,
    verified: 0
  };

  const failedProofs: FlowProofRecord[] = [];
  const lowConfidenceProofs: FlowProofRecord[] = [];

  for (const item of snapshot.proofs) {
    byKind[item.kind] += 1;
    byStatus[item.status] += 1;

    if (item.status === "failed") {
      failedProofs.push(item);
    }

    if (item.confidence < minimumConfidence) {
      lowConfidenceProofs.push(item);
    }
  }

  return {
    byKind,
    byStatus,
    failedProofs: failedProofs.sort(
      (left, right) => Date.parse(right.capturedAt) - Date.parse(left.capturedAt)
    ),
    lowConfidenceProofs: lowConfidenceProofs.sort(
      (left, right) => left.confidence - right.confidence
    ),
    verificationRate:
      snapshot.proofs.length === 0 ? 0 : byStatus.verified / snapshot.proofs.length
  };
}
