import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type MainConditionEntry = {
  type: "condition";
  value: string;
  variable: string;
  mainCondition: Condition;
  subConditions: SubConditionEntry[];
};

export type SubConditionEntry = {
  type: "sub_condition";
  value?: string;
  variable: string;
  condition: Condition;
};

export type Condition = { type: "wildcard" } | { type: "value"; value: string };

export type ConditionEntry = MainConditionEntry | SubConditionEntry;

export type IntervalViewState = MainConditionEntry[];

const initialState: IntervalViewState = [];

type AddConditionPayload = {
  parentIdx?: number;
  conditionType: "value" | "wildcard";
};

export const intervalViewSlice = createSlice({
  name: "intervalView",
  initialState,
  reducers: {
    updateInterval(_, action: PayloadAction<MainConditionEntry[]>) {
      return action.payload;
    },

    deleteIntervalEntry(
      state,
      action: PayloadAction<{ parentIdx?: number; idx: number }>,
    ) {
      const { parentIdx, idx } = action.payload;

      if (parentIdx === undefined) {
        state.splice(idx, 1);
      } else {
        state[parentIdx].subConditions.splice(idx);
      }
    },

    addCondition(state, action: PayloadAction<AddConditionPayload>) {
      const { conditionType, parentIdx } = action.payload;

      if (parentIdx !== undefined) {
        const parent = state[parentIdx];
        const variable =
          parent.subConditions.length === 0
            ? ""
            : parent.subConditions[0].variable;

        const newSub: SubConditionEntry = {
          type: "sub_condition",
          variable,
          condition:
            conditionType === "wildcard"
              ? { type: "wildcard" }
              : { type: "value", value: "" },
        };

        if (conditionType === "wildcard") newSub.value = "";

        parent.subConditions.push(newSub);
        return;
      }

      const variable = state.length === 0 ? "" : state[0].variable;

      state.push({
        type: "condition",
        value: "",
        mainCondition:
          conditionType === "wildcard"
            ? { type: "wildcard" }
            : { type: "value", value: "" },
        variable,
        subConditions: [],
      });
    },
  },
});

export const { addCondition, deleteIntervalEntry, updateInterval } =
  intervalViewSlice.actions;

export default intervalViewSlice.reducer;
