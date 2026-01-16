import { parseValuation } from "@fmfi-uk-1-ain-412/js-fol-parser";
import { selectLanguage } from "../language/languageSlice";
import type {
  TextViewDescriptors,
  TextViewSyncEntry,
} from "../textView/textViews";
import {
  selectValidatedVariables,
  updateVariables,
  type VariablesState,
} from "./variablesSlice";

export interface VariablesTextViewTypeMap {
  variables: [string, string][];
}

export const variablesTextViewDescriptors: TextViewDescriptors<VariablesTextViewTypeMap> =
  {
    variables: {
      payloadType: "value",
      parse: (value, state) =>
        parseValuation(value, selectLanguage(state).getParserLanguage()),
      toText: (structured) =>
        structured.map(([from, to]) => `${from}->${to}`).join(", "),
      validate: (state) => selectValidatedVariables(state).error,
      syncActionCreator: updateVariables,
    },
  };

export const getVariablesTextViewSyncEntries = (variables: VariablesState) => {
  const result: TextViewSyncEntry[] = [];

  result.push({
    textViewType: "variables",
    value: variablesTextViewDescriptors.variables.toText(
      variables.value.map(({ from, to }) => [from, to]),
    ),
  });

  return result;
};
