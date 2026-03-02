import type { ControlButtonsProps } from "../../components_helper/ControlButtons/ControlButtons";
import { omitControlButtons } from "../../components_helper/ControlButtons/omitControlButtons";
import type { EditorType } from "./InterpretationEditor";
import type { TupleType } from "./structureSlice";

export default function getEditorControlButtons(
  intrType: TupleType,
  arity: number,
) {
  const controlButtons: ControlButtonsProps<EditorType>["buttons"] = [
    {
      text: "Text (default)",
      value: "text",
    },
    { text: "Interval", value: "interval" },
  ];

  controlButtons.push({
    text: "Tables",
    value: ["matrix", "database"],
    dropDown: [
      {
        text: "Matrix",
        value: "matrix",
      },
      {
        text: "Database",
        value: "database",
      },
    ],
  });

  controlButtons.push({
    text: "Graphs",
    value: ["oriented", "hasse", "bipartite"],
    dropDown: [
      {
        text: "Oriented",
        value: "oriented",
      },
      {
        text: "Hasse",
        value: "hasse",
      },
      {
        text: "Bipartite",
        value: "bipartite",
      },
    ],
  });

  const isFunction = intrType === "function";
  const correctedArity = isFunction ? arity + 1 : arity;
  const isTuple = correctedArity === 2;

  const controlButtonsToOmit: EditorType[] = [];
  if (isFunction) controlButtonsToOmit.push("hasse");
  if (!isFunction) controlButtonsToOmit.push("interval");
  if (!isTuple) controlButtonsToOmit.push("hasse", "bipartite", "oriented");
  if (arity > 2) controlButtonsToOmit.push("matrix");
  if (arity > 2 && isFunction) controlButtonsToOmit.push("database");

  return omitControlButtons(controlButtons, controlButtonsToOmit);
}
