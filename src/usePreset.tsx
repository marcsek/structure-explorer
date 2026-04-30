import { useEffect } from "react";
import { useAppDispatch } from "./app/hooks";
import {
  updateConstants,
  updateFunctions,
  updatePredicates,
} from "./features/language/languageSlice";
import {
  updateDomain,
  updateFunctionSymbols,
  updateInterpretationConstants,
  updateInterpretationPredicates,
} from "./features/structure/structureSlice";
import { UndoActions } from "./features/undoHistory/undoHistory";
import { addFormulas, updateGuess } from "./features/formulas/formulasSlice";
import { unaryFilterDomainToggled } from "./features/editorToolbar/editorToolbarSlice";

export default function usePreset() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("preset");

    if (preset === "basic") {
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
    } else if (preset === "preview") {
      dispatch(updateConstants(["Alice", "Bob", "Clark", "Dylan", "Ed"]));

      dispatch(
        updatePredicates([
          { name: "učí", arity: 2 },
          { name: "študent", arity: 1 },
          { name: "školník", arity: 1 },
          { name: "riaditeľ", arity: 1 },
          { name: "učiteľ", arity: 1 },
        ]),
      );

      dispatch(updateFunctions([{ name: "známka", arity: 3 }]));

      dispatch(updateDomain(["A", "B", "C", "D", "E"]));

      dispatch(updateInterpretationConstants({ key: "Alice", value: "A" }));
      dispatch(updateInterpretationConstants({ key: "Bob", value: "B" }));
      dispatch(updateInterpretationConstants({ key: "Clark", value: "C" }));
      dispatch(updateInterpretationConstants({ key: "Dylan", value: "D" }));
      dispatch(updateInterpretationConstants({ key: "Ed", value: "E" }));

      dispatch(
        unaryFilterDomainToggled({ tupleName: "učí", tupleType: "predicate" }),
      );
      dispatch(
        unaryFilterDomainToggled({
          tupleName: "študent",
          tupleType: "predicate",
        }),
      );
      dispatch(
        unaryFilterDomainToggled({
          tupleName: "školník",
          tupleType: "predicate",
        }),
      );
      dispatch(
        unaryFilterDomainToggled({
          tupleName: "riaditeľ",
          tupleType: "predicate",
        }),
      );
      dispatch(
        unaryFilterDomainToggled({
          tupleName: "učiteľ",
          tupleType: "predicate",
        }),
      );

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

      dispatch(UndoActions.clearHistory());
    } else if (preset === "chess") {
      dispatch(updateConstants(["white", "black"]));

      dispatch(
        updatePredicates([
          { name: "piece", arity: 1 },
          { name: "square", arity: 1 },
          { name: "king", arity: 1 },
          { name: "rook", arity: 1 },
          { name: "may_enter", arity: 2 },
          { name: "may_take", arity: 2 },
        ]),
      );

      dispatch(
        updateFunctions([
          { name: "on", arity: 1 },
          { name: "clr", arity: 1 },
        ]),
      );

      dispatch(
        updateDomain([
          "♔",
          "♚",
          "♖",
          "♜",
          "a1",
          "a2",
          "a3",
          "b1",
          "b2",
          "b3",
          "c1",
          "c2",
          "c3",
          "W",
          "B",
          "N",
        ]),
      );

      dispatch(updateInterpretationConstants({ key: "white", value: "W" }));
      dispatch(updateInterpretationConstants({ key: "black", value: "B" }));

      dispatch(
        updateInterpretationPredicates({
          key: "piece",
          value: [["♔"], ["♚"], ["♖"], ["♜"]],
        }),
      );

      dispatch(
        updateInterpretationPredicates({
          key: "piece",
          value: [["♔"], ["♚"], ["♖"], ["♜"]],
        }),
      );

      dispatch(
        updateInterpretationPredicates({
          key: "square",
          value: [
            ["a1"],
            ["a2"],
            ["a3"],
            ["b1"],
            ["b2"],
            ["b3"],
            ["c1"],
            ["c2"],
            ["c3"],
          ],
        }),
      );

      dispatch(
        updateInterpretationPredicates({
          key: "king",
          value: [["♔"], ["♚"]],
        }),
      );

      dispatch(
        updateInterpretationPredicates({
          key: "rook",
          value: [["♖"], ["♜"]],
        }),
      );

      dispatch(
        updateInterpretationPredicates({
          key: "may_enter",
          value: [
            ["♔", "a2"],
            ["♔", "b1"],
            ["♔", "b2"],
            ["♚", "c2"],
            ["♚", "b3"],
            ["♚", "b2"],
            ["♖", "a1"],
            ["♖", "a2"],
            ["♖", "b3"],
            ["♖", "c3"],
            ["♜", "c2"],
            ["♜", "c3"],
            ["♜", "a1"],
            ["♜", "b1"],
          ],
        }),
      );

      dispatch(
        updateInterpretationPredicates({
          key: "may_take",
          value: [
            ["♜", "♔"],
            ["♖", "♚"],
          ],
        }),
      );

      dispatch(
        updateFunctionSymbols({
          key: "on",
          value: [
            ["♔", "a1"],
            ["♚", "c3"],
            ["♖", "a3"],
            ["♜", "c1"],
            ["a1", "N"],
            ["a2", "N"],
            ["a3", "N"],
            ["b1", "N"],
            ["b2", "N"],
            ["b3", "N"],
            ["c1", "N"],
            ["c2", "N"],
            ["c3", "N"],
            ["W", "N"],
            ["B", "N"],
            ["N", "N"],
          ],
        }),
      );

      dispatch(
        updateFunctionSymbols({
          key: "clr",
          value: [
            ["B", "W"],
            ["N", "B"],
            ["W", "W"],
            ["a1", "B"],
            ["a2", "W"],
            ["a3", "B"],
            ["b1", "W"],
            ["b2", "B"],
            ["b3", "W"],
            ["c1", "B"],
            ["c2", "W"],
            ["c3", "B"],
            ["♔", "W"],
            ["♖", "W"],
            ["♚", "B"],
            ["♜", "B"],
          ],
        }),
      );

      dispatch(
        addFormulas([
          {
            text: "(∀x (piece(x) → square(on(x)))  ∧  ∀x ((king(x)  ∨  rook(x)) → piece(x)))",
          },
          {
            text: "∀x ((piece(x)  ∨  square(x)) → (clr(x) = white  ∨  clr(x) = black))",
          },
          {
            text: "∀x ∀y (((square(x)  ∧  piece(y))  ∧  on(y) = x) → ∀z ((piece(z)  ∧  on(z) = x) → z = y))",
          },
          {
            text: "(∀x (piece(x) → (¬square(x)  ∧  ¬∃y clr(y) = x))  ∧  ∀x (square(x) → ¬∃y clr(y) = x))",
          },
          {
            text: "∀x ∀y ((piece(x)  ∧  piece(y)) → ((¬clr(x) = clr(y)  ∧  may_enter(x, on(y))) ↔ may_take(x, y)))",
          },
        ]),
      );

      dispatch(updateGuess({ id: 0, guess: true }));
      dispatch(updateGuess({ id: 1, guess: true }));
      dispatch(updateGuess({ id: 2, guess: true }));
      dispatch(updateGuess({ id: 3, guess: true }));
      dispatch(updateGuess({ id: 4, guess: true }));

      dispatch(UndoActions.clearHistory());
    }
  }, [dispatch]);
}
