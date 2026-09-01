import "./PredicatePalettePicker.css";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppDispatch } from "../../../app/hooks";
import { setActivePalette } from "../predicatePaletteSlice";
import PaletteTitle from "./PaletteTitle";
import type { Palette, PaletteKind } from "../palettes";

interface PredicatePalettePickerProps {
  palettes: Palette[];
  activePaletteKind: PaletteKind;
}

export default function PredicatePalettePicker({
  palettes,
  activePaletteKind,
}: PredicatePalettePickerProps) {
  const dispatch = useAppDispatch();

  return (
    <div className="predicate-palette-picker">
      <PaletteTitle
        id="predicate-palette-title"
        title="Available Palettes"
        subtitle="The selected palette is active."
      />

      <ul className="predicate-palette-picker-list">
        {palettes.map((palette) => {
          const active = palette.kind === activePaletteKind;

          return (
            <li key={palette.kind}>
              <button
                className={`predicate-palette-item-button ${active ? "active" : ""}`}
                onClick={() => dispatch(setActivePalette(palette.kind))}
              >
                <span className="predicate-palette-item-header">
                  <span className="predicate-palette-item-name">
                    {palette.kind}
                  </span>

                  {active && (
                    <FontAwesomeIcon
                      className="predicate-palette-item-check"
                      icon={faCheck}
                    />
                  )}
                </span>

                <span className="predicate-palette-item-bar">
                  {palette.colors.map((color, idx) => (
                    <span key={idx} style={{ backgroundColor: color }} />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
