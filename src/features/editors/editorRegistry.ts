import type { ControlButton } from "../../shared/ui/ControlButtons/ControlButtons";
import { omitControlButtons } from "../../shared/ui/ControlButtons/omitControlButtons";
import type { TupleInfo } from "../structure/tupleInfo";
import type { EditorType } from "./editorTypes";

export type EditorGroup = "tables" | "graphs";

export interface EditorDescriptor {
  type: EditorType;
  displayName: string;
  buttonText: string;
  group?: EditorGroup;
  isAvailable: (tuple: TupleInfo) => boolean;
}

const correctedArity = ({ type, arity }: TupleInfo) =>
  type === "function" ? arity + 1 : arity;

const isBinaryRelation = (tuple: TupleInfo) => correctedArity(tuple) === 2;

export const editorDescriptors: Record<EditorType, EditorDescriptor> = {
  text: {
    type: "text",
    displayName: "Text Editor",
    buttonText: "Text (default)",
    isAvailable: () => true,
  },
  caseTree: {
    type: "caseTree",
    displayName: "Case Tree Editor",
    buttonText: "Case Tree",
    isAvailable: ({ type }) => type === "function",
  },
  matrix: {
    type: "matrix",
    displayName: "Matrix Editor",
    buttonText: "Matrix",
    group: "tables",
    isAvailable: ({ arity }) => arity <= 2,
  },
  database: {
    type: "database",
    displayName: "Database Table Editor",
    buttonText: "Database",
    group: "tables",
    isAvailable: ({ type, arity }) => !(arity > 2 && type === "function"),
  },
  oriented: {
    type: "oriented",
    displayName: "Oriented Graph",
    buttonText: "Oriented",
    group: "graphs",
    isAvailable: isBinaryRelation,
  },
  hasse: {
    type: "hasse",
    displayName: "Hasse Diagram",
    buttonText: "Hasse",
    group: "graphs",
    isAvailable: (tuple) =>
      isBinaryRelation(tuple) && tuple.type !== "function",
  },
  bipartite: {
    type: "bipartite",
    displayName: "Bipartite Graph",
    buttonText: "Bipartite",
    group: "graphs",
    isAvailable: isBinaryRelation,
  },
};

export const getEditorDisplayName = (type: EditorType) =>
  editorDescriptors[type].displayName;

const groupLabels: Record<EditorGroup, string> = {
  tables: "Tables",
  graphs: "Graphs",
};

const buttonOrder: (EditorType | EditorGroup)[] = [
  "text",
  "caseTree",
  "tables",
  "graphs",
];

const isGroup = (entry: EditorType | EditorGroup): entry is EditorGroup =>
  entry in groupLabels;

const groupMembers = (group: EditorGroup) =>
  Object.values(editorDescriptors).filter(
    (descriptor) => descriptor.group === group,
  );

export const buildEditorControlButtons = (
  tuple: TupleInfo,
  omit: EditorType[] = [],
): ControlButton<EditorType>[] => {
  const buttons: ControlButton<EditorType>[] = [];

  for (const entry of buttonOrder) {
    if (!isGroup(entry)) {
      const descriptor = editorDescriptors[entry];
      if (descriptor.isAvailable(tuple))
        buttons.push({ text: descriptor.buttonText, value: descriptor.type });
      continue;
    }

    const available = groupMembers(entry).filter((descriptor) =>
      descriptor.isAvailable(tuple),
    );

    if (available.length === 0) continue;

    buttons.push({
      text: groupLabels[entry],
      value: available.map(({ type }) => type),
      dropDown: available.map(({ type, buttonText }) => ({
        text: buttonText,
        value: type,
      })),
    });
  }

  const remaining = omitControlButtons(buttons, omit);

  if (remaining.length === 1 && remaining[0].value === "text") return [];

  return remaining;
};
