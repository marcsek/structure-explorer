import { useCallback, useLayoutEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import type { EditorType } from "../editors/editorTypes";
import type { TupleInfo } from "../structure/tupleInfo";
import { editorOpened, selectOpenedEditor } from "./editorToolbarSlice";

export function useOpenedEditor(tupleInfo: TupleInfo) {
  const { arity } = tupleInfo;

  const dispatch = useAppDispatch();

  const openedEditor = useAppSelector((state) =>
    selectOpenedEditor(state, tupleInfo),
  );

  const selectEditor = useCallback(
    (editor: EditorType) => dispatch(editorOpened({ tupleInfo, editor })),
    [dispatch, tupleInfo],
  );

  const previousArityRef = useRef(arity);

  useLayoutEffect(() => {
    if (previousArityRef.current !== arity) selectEditor("text");
  }, [arity, selectEditor]);

  return { openedEditor, selectEditor };
}
