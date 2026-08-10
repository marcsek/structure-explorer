import type { ControlButton } from "../../shared/ui/ControlButtons/ControlButtons";
import { omitControlButtons } from "../../shared/ui/ControlButtons/omitControlButtons";
import type { TupleInfo } from "../structure/tupleInfo";
import { editorDescriptors } from "./editorRegistry";
import type { EditorGroup } from "./editorDescriptor";
import type { EditorType } from "./editorTypes";

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

export const fullscreenOmittedEditors = (): EditorType[] =>
  Object.values(editorDescriptors)
    .filter((descriptor) => !descriptor.supportsFullscreen)
    .map(({ type }) => type);

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
