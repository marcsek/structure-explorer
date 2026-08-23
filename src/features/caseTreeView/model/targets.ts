export type CaseRef =
  | { kind: "case"; nodeId: string; caseIdx: number }
  | { kind: "default"; nodeId: string };

export type EditTarget =
  | { kind: "value"; ref: CaseRef }
  | { kind: "variable"; nodeId: string }
  | { kind: "match"; nodeId: string; caseIdx: number };

export type AppendTarget =
  | { kind: "appendValue"; nodeId: string }
  | { kind: "appendMatch"; nodeId: string };

export type BranchTarget =
  { kind: "initial" } | { kind: "nested"; ref: CaseRef };
