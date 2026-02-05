import type { EditorType } from "../../features/structure/InterpretationEditor";
import type { ControlButton } from "./ControlButtons";

export const omitControlButtons = (
  controlButtons: ControlButton<EditorType>[],
  omit: EditorType[],
) => {
  if (omit.length === 0) return controlButtons;

  const filteredButtons = controlButtons
    .map((button) => {
      if (!("dropDown" in button))
        return omit.includes(button.value) ? null : button;

      const filteredValues = button.value.filter((v) => !omit.includes(v));
      const filteredDropdown = button.dropDown.filter(
        ({ value }) => !omit.includes(value),
      );

      if (filteredValues.length === 0) return null;

      return {
        ...button,
        value: filteredValues,
        dropDown: filteredDropdown,
      };
    })
    .filter((button) => button !== null);

  if (filteredButtons.length === 1 && filteredButtons[0].value === "text")
    return [];

  return filteredButtons;
};
