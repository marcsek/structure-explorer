import { useEffect } from "react";
import { useAppDispatch } from "./app/hooks";
import {
  updateFunctions,
  updatePredicates,
} from "./features/language/languageSlice";
import {
  updateDomain,
  updateInterpretationPredicates,
} from "./features/structure/structureSlice";
import { UndoActions } from "./features/undoHistory/undoHistory";

export default function usePreset() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("preset");

    if (preset !== "basic") return;

    dispatch(
      updatePredicates([
        { name: "teaches", arity: 2 },
        { name: "student", arity: 1 },
        { name: "janitor", arity: 1 },
        { name: "principal", arity: 1 },
        { name: "teacher", arity: 1 },
      ]),
    );

    dispatch(updateFunctions([{ name: "room", arity: 1 }]));

    dispatch(updateDomain(["A", "B", "C", "D", "E"]));

    dispatch(
      updateInterpretationPredicates({
        key: "student",
        value: [["A"], ["B"]],
      }),
    );
    dispatch(
      updateInterpretationPredicates({
        key: "janitor",
        value: [["C"], ["D"]],
      }),
    );
    dispatch(
      updateInterpretationPredicates({
        key: "principal",
        value: [["A"], ["C"], ["E"]],
      }),
    );
    dispatch(
      updateInterpretationPredicates({
        key: "teacher",
        value: [["A"], ["B"], ["C"], ["D"], ["E"]],
      }),
    );

    dispatch(UndoActions.clearHistory());
  }, [dispatch]);
}
