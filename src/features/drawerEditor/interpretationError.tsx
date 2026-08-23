import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import type { AppThunk } from "../../app/store";
import {
  removeInvalidEntries,
  selectTupleValidation,
} from "../structure/structureSlice";
import type { TupleInfo } from "../structure/tupleInfo";
import { UndoActions } from "../undoHistory/undoHistory";
import type { EditorErrorSource } from "./drawerEditorAdapter";

const removeInvalid =
  (tupleInfo: TupleInfo): AppThunk =>
  (dispatch) => {
    dispatch(removeInvalidEntries({ tupleInfo }));
    dispatch(UndoActions.checkpoint());
  };

const selectInterpretationError: EditorErrorSource["select"] = (
  state,
  { name, type },
) => selectTupleValidation(state, name, type);

export const interpretationError: EditorErrorSource = {
  select: selectInterpretationError,
  fixButton: (
    <>
      <FontAwesomeIcon icon={faTrash} size="sm" />
      Remove invalid
    </>
  ),
  onFix: removeInvalid,
};

export const unfixableInterpretationError: EditorErrorSource = {
  select: (state, tupleInfo) => {
    const error = selectInterpretationError(state, tupleInfo);

    return error?.kind === "semantic" && error.repairable ? undefined : error;
  },
};
