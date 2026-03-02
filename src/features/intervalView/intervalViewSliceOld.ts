import { createSlice } from "@reduxjs/toolkit";
import type { MainConditionEntry, SubConditionEntry } from "./IntervalView";

type ConditionNode = {
  type: "variable";
  id: string;
  variable: string;
  edges: Edge[];
};

type ValueNode = {
  type: "value";
  id: string;
  value: string;
};

type Edge = {
  condition: Condition;
  childId: string;
};

type Node = ConditionNode | ValueNode;

type Condition = { type: "wildcard" } | { type: "value"; value: string };

export type IntervalViewState = { rootId: string; nodes: Record<string, Node> };

const initialState: IntervalViewState = {
  rootId: "root",

  nodes: {
    ["root"]: {
      id: "root",
      type: "variable",
      variable: "x",
      edges: [
        { condition: { type: "value", value: "1" }, childId: "val_1" },
        { condition: { type: "value", value: "2" }, childId: "var_y" },
      ],
    },

    ["var_y"]: {
      id: "var_y",
      type: "variable",
      variable: "y",
      edges: [
        { condition: { type: "value", value: "3" }, childId: "val_2" },
        { condition: { type: "wildcard" }, childId: "val_3" },
      ],
    },

    ["val_1"]: {
      id: "val_1",
      type: "value",
      value: "2",
    },

    ["val_2"]: {
      id: "val_2",
      type: "value",
      value: "4",
    },

    ["val_3"]: {
      id: "val_3",
      type: "value",
      value: "0",
    },
  },
};

export const intervalViewSlice = createSlice({
  name: "intervalView",
  initialState,
  reducers: {},
});

export function conditionTreeToConditionEntries({
  rootId,
  nodes,
}: IntervalViewState): MainConditionEntry[] {
  const node = nodes[rootId];

  if (node.type === "value") return [];

  const all: MainConditionEntry[] = [];

  for (const edge of node.edges) {
    const child = nodes[edge.childId];

    if (child.type === "value") {
      all.push({
        type: "condition",
        mainCondition: edge.condition,
        variable: node.variable,
        value: child.value,
      });

      continue;
    }

    const subs = conditionTreeToConditionEntries({ rootId: child.id, nodes });

    const res: MainConditionEntry[] = [];
    for (const sub of subs) {
      const subConds: SubConditionEntry[] = [
        ...(sub.subConditions ?? []),
        {
          type: "sub_condition",
          variable: sub.variable,
          condition: sub.mainCondition,
        },
      ];

      res.push({
        type: "condition",
        value: sub.value,
        variable: node.variable,
        mainCondition: edge.condition,
        subConditions: subConds,
      });
    }

    all.push(...res);
  }

  return all;
}

export default intervalViewSlice.reducer;
