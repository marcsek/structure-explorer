import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import type { EditorType } from "../editors/editorTypes";
import type { TupleInfo } from "../structure/tupleInfo";
import { editorOpened, selectOpenedEditor } from "./editorToolbarSlice";

export function useOpenedEditor({ name, type, arity }: TupleInfo) {
  const dispatch = useAppDispatch();

  // The returned tuple info reference stays stable for downstream use in e.g. useEffects.
  const tupleInfo = useMemo(() => ({ name, type, arity }), [name, type, arity]);

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

  return { tupleInfo, openedEditor, selectEditor };
}
