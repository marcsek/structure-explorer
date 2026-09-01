import "./PredicatePalette.css";

import { CloseButton, Modal } from "react-bootstrap";
import { useAppSelector } from "../../app/hooks";
import {
  selectActivePalette,
  selectAvailablePalettes,
} from "./predicatePaletteSlice";
import PaletteEditor from "./components/PaletteEditor";
import PredicatePalettePicker from "./components/PredicatePalettePicker";
import PredicatePalettePreview from "./components/PredicatePalettePreview";

interface PredicatePaletteProps {
  show: boolean;
  onHide: () => void;
}

export default function PredicatePalette({
  show,
  onHide,
}: PredicatePaletteProps) {
  const availablePalettes = useAppSelector(selectAvailablePalettes);
  const activePalette = useAppSelector(selectActivePalette);

  return (
    <Modal
      show={show}
      onHide={onHide}
      className="structure-explorer"
      dialogClassName="predicate-palette-modal-dialog"
      contentClassName="predicate-palette-modal-content"
      centered
    >
      <PredicatePalettePicker
        palettes={availablePalettes}
        activePaletteKind={activePalette.kind}
      />

      <div className="predicate-palette-body">
        {activePalette.kind === "custom" && (
          <PaletteEditor colors={activePalette.colors} />
        )}

        <PredicatePalettePreview colors={activePalette.colors} />

        <CloseButton
          className="predicate-palette-close-button"
          onClick={onHide}
        />
      </div>
    </Modal>
  );
}
