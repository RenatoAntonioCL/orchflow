export type AgentId =
  | 'chief-architect'
  | 'backend-tl'
  | 'frontend-tl'
  | 'devops'
  | 'backend-dev'
  | 'frontend-dev'
  | 'qa'
  | 'tech-writer';

export type AgentRole =
  | 'orchestrator'
  | 'tech-lead'
  | 'developer'
  | 'devops'
  | 'qa'
  | 'tech-writer';

export type OutputLevel = 'blueprint' | 'scaffold' | 'mvp' | 'deliverable';

export interface AgentPlanStep {
  agentId: AgentId;
  role: AgentRole;
  dependsOn: AgentId[];
  canRunParallel: boolean;
  context: string;
}

export interface ProjectBlueprint {
  _version: '1.0';
  id: string;
  createdAt: string;

  name: string;
  description: string;
  projectType: 'webapp' | 'api' | 'fullstack' | 'cli' | 'microservice' | 'library';

  outputLevel: OutputLevel;
  difficulty: 'low' | 'medium' | 'high' | 'critical';
  estimatedMinutes: number;
  estimatedCostUSD: number;

  stack: {
    language: string;
    runtime: string;
    framework: string;
    database?: string;
    queue?: string;
    cache?: string;
    frontend?: string;
  };

  agentPlan: AgentPlanStep[];
  architectureDecisions: string[];
  risks: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description: string;
}

export interface AgentMetrics {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
}

export interface AgentOutput {
  _version: '1.0';
  agentId: AgentId;
  role: AgentRole;
  status: 'success' | 'failed' | 'rejected';
  promptVersion: string;
  files: GeneratedFile[];
  decisions: string[];
  notes: string;
  reviewFeedback?: string;
  metrics: AgentMetrics;
}

export interface QACheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface RunResult {
  _version: '1.0';
  runId: string;
  blueprint: ProjectBlueprint;
  status: 'completed' | 'partial' | 'failed';

  totalFiles: number;
  totalAgentCalls: number;
  totalTokensUsed: number;
  actualCostUSD: number;
  durationMs: number;

  qaReport: {
    passed: boolean;
    buildSuccess: boolean;
    checks: QACheck[];
    criticalIssues: string[];
    warnings: string[];
    scores: {
      correctness: number;
      coherence: number;
      completeness: number;
      quality: number;
    };
  };

  outputZipPath: string;
}

export interface Provider {
  complete(prompt: string): Promise<{ text: string; inputTokens: number; outputTokens: number }>;
}
