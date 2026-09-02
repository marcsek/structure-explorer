import "./PredicatePalette.css";

import { useRef } from "react";
import { CloseButton, Modal } from "react-bootstrap";
import { useAppDispatch, useAppSelector, useAppStore } from "../../app/hooks";
import {
  closePredicatePalette,
  selectActivePalette,
  selectAvailablePalettes,
  selectCustomPaletteColors,
  selectPredicatePaletteState,
} from "./predicatePaletteSlice";
import PaletteEditor from "./components/PaletteEditor";
import PredicatePalettePicker from "./components/PredicatePalettePicker";
import PredicatePalettePreview from "./components/PredicatePalettePreview";
import { isBakedPaletteKind } from "./palettes";

interface PredicatePaletteProps {
  show: boolean;
  onHide: () => void;
}

export default function PredicatePalette({
  show,
  onHide,
}: PredicatePaletteProps) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const availablePalettes = useAppSelector(selectAvailablePalettes);
  const activePalette = useAppSelector(selectActivePalette);
  const customPaletteColors = useAppSelector(selectCustomPaletteColors);

  const paletteOnOpen = useRef(selectPredicatePaletteState(store.getState()));

  const closePalette = () => {
    dispatch(closePredicatePalette(paletteOnOpen.current));
    onHide();
  };

  return (
    <Modal
      show={show}
      onShow={() => {
        paletteOnOpen.current = selectPredicatePaletteState(store.getState());
      }}
      onHide={closePalette}
      className="structure-explorer"
      dialogClassName="predicate-palette-modal-dialog"
      contentClassName="predicate-palette-modal-content"
      aria-labelledby="predicate-palette-title"
      centered
    >
      <PredicatePalettePicker
        palettes={availablePalettes}
        activePaletteKind={activePalette.kind}
      />

      <div className="predicate-palette-body">
        {!isBakedPaletteKind(activePalette.kind) && (
          <PaletteEditor colors={customPaletteColors} />
        )}

        <PredicatePalettePreview colors={activePalette.colors} />

        <CloseButton
          className="predicate-palette-close-button"
          onClick={closePalette}
        />
      </div>
    </Modal>
  );
}
