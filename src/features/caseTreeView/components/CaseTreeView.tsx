import "./CaseTreeView.css";

import { useEffect } from "react";
import { Stack } from "react-bootstrap";
import { InlineMath } from "react-katex";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { initializeTree, selectCasePaths } from "../caseTreeViewSlice";
import { intervalVariables } from "../model/caseTree";
import { getAllowedVars, getSingleBranchPath } from "../model/caseRow";
import CaseRow from "./CaseRow";
import CasesBrace from "./CasesBrace";
import SingleCaseRow from "./SingleCaseRow";
import { latex } from "../../../shared/core/utils";
import type { DrawerEditorProps } from "../../drawerEditor/drawerEditorAdapter";

export default function CaseTreeView({ tupleInfo, locked }: DrawerEditorProps) {
  const { name: functionName, arity: tupleArity } = tupleInfo;

  const dispatch = useAppDispatch();

  const casePaths = useAppSelector((state) =>
    selectCasePaths(state, functionName),
  );

  useEffect(() => {
    if (!casePaths) dispatch(initializeTree(functionName));
  }, [dispatch, casePaths, functionName]);

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
            casePaths.map((path) => (
              <CaseRow
                key={path.id}
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
