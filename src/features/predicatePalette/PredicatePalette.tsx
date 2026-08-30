import "./PredicatePalette.css";

import { CloseButton, Modal } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectActivePalette,
  selectAvailablePalettes,
  setActivePalette,
} from "./predicatePaletteSlice";
import { RelevantPredicatesIndicator } from "../../shared/ui/RelevantPredicatesIndicator/RelevantPredicatesIndicator";
import { PredicatePill } from "../../shared/ui/PredicatePill/PredicatePill";
import { useState } from "react";
import PredicateNodeVisual from "../graphView/canvas/nodes/PredicateNodeVisual";
import UnaryPredicatesIndicator from "../graphView/canvas/nodes/UnaryPredicatesIndicator";

interface PredicatePaletteProps {
  show: boolean;
  onHide: () => void;
}

export default function PredicatePalette({
  show,
  onHide,
}: PredicatePaletteProps) {
  const dispatch = useAppDispatch();
  const availablePalettes = useAppSelector(selectAvailablePalettes);
  const activePalette = useAppSelector(selectActivePalette);

  return (
    <Modal
      show={show}
      onHide={onHide}
      className="structure-explorer"
      dialogClassName="predicate-palette-modal-dialog"
      contentClassName="predicate-palette-modal-content"
      aria-labelledby="predicate-palette-title"
      centered
    >
      <div className="predicate-palette-picker">
        <h2 className="predicate-palette-title" id="predicate-palette-title">
          Active Palette
        </h2>

        <ul className="predicate-palette-picker-list">
          {availablePalettes.map((palette) => (
            <li key={palette.kind}>
              <button
                className={`predicate-palette-item-button ${palette.kind === activePalette.kind ? "active" : ""}`}
                onClick={() => dispatch(setActivePalette(palette.kind))}
              >
                <span>{palette.kind}</span>
                <RelevantPredicatesIndicator
                  predicateToColorMap={
                    new Map(palette.colors.map((c, idx) => [String(idx), c]))
                  }
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <PredicatePalettePreview colors={activePalette.colors} />
      <CloseButton
        className="predicate-palette-close-button"
        onClick={onHide}
      />
    </Modal>
  );
}

interface PredicatePalettePreviewProps {
  colors: string[];
}

function PredicatePalettePreview({ colors }: PredicatePalettePreviewProps) {
  const [unselected, setUnselected] = useState<number[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);

  const togglePredicate = (id: number) => {
    setUnselected((p) =>
      p.includes(id) ? p.filter((pred) => pred !== id) : [...p, id],
    );
  };

  const predicateToColor = new Map(
    colors
      .map((color, id) => [predicateName(id), color, id] as const)
      .filter(([, , id]) => !unselected.includes(id) || hovered === id)
      .map(([pred, color]) => [pred, color]),
  );

  const nodePredicateIndicator = (
    <UnaryPredicatesIndicator
      predicateToColor={predicateToColor}
      previewed={
        hovered !== null && unselected.includes(hovered)
          ? [predicateName(hovered)]
          : undefined
      }
    />
  );

  return (
    <div className="predicate-palette-preview">
      <h2 className="predicate-palette-title">Preview</h2>

      <div className="predicate-palette-preview-pills">
        {colors.map((color, id) => (
          <PredicatePill
            key={id}
            predicate={predicateName(id)}
            color={color}
            selected={!unselected.includes(id)}
            onChange={() => togglePredicate(id)}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>

      <div className="predicate-palette-preview-nodes">
        <PredicateNodeVisual
          label="A"
          constants={["Mark"]}
          indicator={nodePredicateIndicator}
          standalone
        />

        <PredicateNodeVisual
          label="A"
          constants={["Mark"]}
          indicator={nodePredicateIndicator}
          standalone
          ghost
          hovered
        />
      </div>
    </div>
  );
}

function predicateName(id: number) {
  return `Pred${id + 1}`;
}
