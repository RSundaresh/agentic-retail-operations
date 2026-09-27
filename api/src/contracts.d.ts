export type Agent = 'demand' | 'inventory' | 'allocation' | 'risk' | 'value' | 'execution';
export type State = 'running' | 'executing' | 'pending' | 'blocked' | 'failed' | 'rejected' | 'completed';
/** Internal retail-task/2 contract. NOT an official A2A protocol implementation. */
export interface TaskEnvelope {
  contractVersion: 'retail-task/2'; taskId: string; correlationId: string;
  from: 'orchestrator'; to: Agent; taskType: Agent; attempt: number;
  model: string; deadline: string; input: Record<string, unknown>;
}
export interface Outputs {
  demand: { forecastUnits: number; rationale: string };
  inventory: { availableUnits: number; rationale: string };
  allocation: { transferUnits: number; rationale: string };
  risk: { approved: boolean; rationale: string };
  value: { marginProtected: number; transferCost: number; netValue: number };
  execution: { receiptId: string; action: 'demo-transfer'; units: number; enterpriseWrite: false };
}
export interface TraceEntry {
  taskId: string; correlationId: string; agent: Agent; model: string;
  attempt: number; event: 'started' | 'succeeded' | 'failed'; at: string;
  latencyMs?: number; code?: string;
}
export interface Run {
  id: string; owner: string; scenario: 'inventory' | 'promotion'; state: State;
  mode: 'live' | 'simulated'; revision: number | string; expiresAt: string;
  outputs: Partial<Outputs>; trace: TraceEntry[];
  approval?: { decision: 'approve' | 'reject'; actor: string; at: string };
}
