import {
  updateConstants,
  updateFunctions,
  updatePredicates,
} from "../features/language/languageSlice";
import {
  updateDomain,
  updateFunctionSymbols,
  updateInterpretationConstants,
  updateInterpretationPredicates,
} from "../features/structure/structureSlice";
import { addFormulas } from "../features/formulas/formulasSlice";
import { unaryFilterDomainToggled } from "../features/editorToolbar/editorToolbarSlice";
import {
  addQuery,
  updateQueryText,
  updateQueryVariablesText,
} from "../features/queries/queriesSlice";
import type { Preset } from "./usePreset";

const preview: Preset = (dispatch) => {
  dispatch(updateConstants(["Alice", "Bob", "Clark", "Dylan", "Ed"]));

  const predicates = [
    { name: "učí", arity: 2 },
    { name: "študent", arity: 1 },
    { name: "školník", arity: 1 },
    { name: "riaditeľ", arity: 1 },
    { name: "učiteľ", arity: 1 },
  ];

  dispatch(updatePredicates(predicates));

  dispatch(updateFunctions([{ name: "sedí_s", arity: 1 }]));

  dispatch(updateDomain(["A", "B", "C", "D", "E"]));

  dispatch(updateInterpretationConstants({ key: "Alice", value: "A" }));
  dispatch(updateInterpretationConstants({ key: "Bob", value: "B" }));
  dispatch(updateInterpretationConstants({ key: "Clark", value: "C" }));
  dispatch(updateInterpretationConstants({ key: "Dylan", value: "D" }));
  dispatch(updateInterpretationConstants({ key: "Ed", value: "E" }));

  for (const { name, arity } of predicates) {
    dispatch(
      unaryFilterDomainToggled({
        tupleInfo: { name, arity, type: "predicate" },
      }),
    );
  }

  dispatch(
    updateInterpretationPredicates({
      key: "študent",
      value: [["A"], ["B"]],
    }),
  );
  dispatch(
    updateInterpretationPredicates({
      key: "školník",
      value: [["C"], ["D"]],
    }),
  );
  dispatch(
    updateInterpretationPredicates({
      key: "riaditeľ",
      value: [["A"], ["C"], ["E"]],
    }),
  );
  dispatch(
    updateInterpretationPredicates({
      key: "učiteľ",
      value: [["A"], ["B"], ["C"], ["D"], ["E"]],
    }),
  );

  dispatch(
    updateFunctionSymbols({
      key: "sedí_s",
      value: [
        ["A", "B"],
        ["D", "E"],
        ["C", "C"],
        ["B", "A"],
        ["E", "D"],
      ],
    }),
  );

  dispatch(
    addFormulas([
      {
        text: "∀x∀y((učí(x,y) ∧ študent(y)) → učiteľ(x))",
      },
      {
        text: "∀x(riaditeľ(x) → učiteľ(x)) ∧ ∃x(učiteľ(x) ∧ ¬riaditeľ(x))",
      },
    ]),
  );

  dispatch(addQuery());
  dispatch(updateQueryText({ idx: 0, text: "riaditeľ(x) → ¬učí(x,y)" }));
  dispatch(updateQueryVariablesText({ idx: 0, text: "x, y" }));
};

export default preview;
