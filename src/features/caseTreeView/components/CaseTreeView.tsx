import "./CaseTreeView.css";

import { useEffect } from "react";
import { Stack } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { InlineMath } from "react-katex";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  initializeTree,
  regenerateInterpretation,
  selectCasePaths,
} from "../caseTreeViewSlice";
import { intervalVariables } from "../model/caseTree";
import { getCasePathErrors } from "../model/flattenTree";
import { getAllowedVars, getSingleBranchPath } from "../model/caseRow";
import CaseRow from "./CaseRow";
import CasesBrace from "./CasesBrace";
import SingleCaseRow from "./SingleCaseRow";
import { latex } from "../../../shared/core/utils";
import {
  selectIfLock,
  selectValidatedFunction,
} from "../../structure/structureSlice";
import { createSemanticError } from "../../../shared/core/errors";
import type { DrawerEditorProps } from "../../drawerEditor/drawerEditorAdapter";

export default function CaseTreeView({
  tupleInfo,
  setErrorOverride,
}: DrawerEditorProps) {
  const { name: functionName, arity: tupleArity } = tupleInfo;

  const dispatch = useAppDispatch();

  const casePaths = useAppSelector((state) =>
    selectCasePaths(state, functionName),
  );
  const locked = useAppSelector((state) => selectIfLock(state, functionName));

  const functionIntr = useAppSelector((state) =>
    selectValidatedFunction(state, functionName),
  );

  useEffect(() => {
    if (!casePaths) dispatch(initializeTree(functionName));
  }, [dispatch, casePaths, functionName]);

  const errors = casePaths?.flatMap((p) => getCasePathErrors(p)) ?? [];

  useEffect(() => {
    if (functionIntr.error && errors.length === 0)
      setErrorOverride({
        editor: "caseTree",
        fixButton: (
          <>
            <FontAwesomeIcon icon={faArrowsRotate} /> Regenerate
          </>
        ),
        error: createSemanticError(
          "This editor is out of sync due to errors in the interpretation. You can regenerate a valid interpretation.",
          true,
        ),
        onFixButtonClick: () =>
          dispatch(regenerateInterpretation(functionName)),
      });
    else setErrorOverride(null);
  }, [
    dispatch,
    errors.length,
    functionIntr.error,
    functionIntr.parsed,
    setErrorOverride,
    functionName,
  ]);

  if (!casePaths) return null;

  const allowedVars = getAllowedVars(tupleArity);
  const singlePath = getSingleBranchPath(casePaths);

  return (
    <div className="case-tree-view-wrapper">
      <Stack direction="horizontal" gap={2} className="case-tree-view">
        <div className="case-tree-view-label">
          <InlineMath>{`i(${latex().text(functionName).get()})(${intervalVariables.slice(0, tupleArity)}) = `}</InlineMath>
        </div>

        <CasesBrace />

        <Stack gap={2} className="case-tree-view-branches">
          {singlePath ? (
            <SingleCaseRow
              path={singlePath}
              functionName={functionName}
              allowedVars={allowedVars}
              locked={locked}
            />
          ) : (
            casePaths.map((path, idx) => (
              <CaseRow
                key={idx}
                path={path}
                functionName={functionName}
                allowedVars={allowedVars}
                locked={locked}
              />
            ))
          )}
        </Stack>
      </Stack>
    </div>
  );
}
