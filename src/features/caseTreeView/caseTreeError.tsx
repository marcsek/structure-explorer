import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { createSemanticError } from "../../shared/core/errors";
import type { EditorErrorSource } from "../drawerEditor/drawerEditorAdapter";
import {
  regenerateInterpretation,
  selectCaseTreeOutOfSync,
} from "./caseTreeViewSlice";

const outOfSyncError = createSemanticError(
  "This editor is out of sync due to errors in the interpretation. You can regenerate a valid interpretation.",
  true,
);

export const caseTreeOutOfSync: EditorErrorSource = {
  select: (state, { name }) =>
    selectCaseTreeOutOfSync(state, name) ? outOfSyncError : undefined,
  fixButton: (
    <>
      <FontAwesomeIcon icon={faArrowsRotate} /> Regenerate
    </>
  ),
  onFix: ({ name }) => regenerateInterpretation(name),
};
