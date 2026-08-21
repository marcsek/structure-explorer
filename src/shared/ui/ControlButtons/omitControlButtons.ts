import type { ControlButton } from "./ControlButtons";

export const omitControlButtons = <T>(
  controlButtons: ControlButton<T>[],
  omit: T[],
): ControlButton<T>[] => {
  if (omit.length === 0) return controlButtons;

  return controlButtons
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
};
