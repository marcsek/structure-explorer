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
import { addFormulas, updateGuess } from "../features/formulas/formulasSlice";
import type { Preset } from "./usePreset";

const formulas = [
  "(∀x (piece(x) → square(on(x)))  ∧  ∀x ((king(x)  ∨  rook(x)) → piece(x)))",
  "∀x ((piece(x)  ∨  square(x)) → (clr(x) = white  ∨  clr(x) = black))",
  "∀x ∀y (((square(x)  ∧  piece(y))  ∧  on(y) = x) → ∀z ((piece(z)  ∧  on(z) = x) → z = y))",
  "(∀x (piece(x) → (¬square(x)  ∧  ¬∃y clr(y) = x))  ∧  ∀x (square(x) → ¬∃y clr(y) = x))",
  "∀x ∀y ((piece(x)  ∧  piece(y)) → ((¬clr(x) = clr(y)  ∧  may_enter(x, on(y))) ↔ may_take(x, y)))",
];

const chess: Preset = (dispatch) => {
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

  dispatch(addFormulas(formulas.map((text) => ({ text }))));

  formulas.forEach((_, id) => dispatch(updateGuess({ id, guess: true })));
};

export default chess;
