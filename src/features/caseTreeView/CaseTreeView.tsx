import "./CaseTreeView.css";

import { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import {
  addCase,
  deleteCase,
  initializeTree,
  selectMaxDepthReached,
  selectSwitchExhausted,
  selectTreeNodeValidation,
  updateBranch,
  updateCase,
  updateNode,
  type CaseTreeBranch,
  type CaseTreeNode,
} from "./caseTreeViewSlice";
import { Button, Dropdown, FormControl } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { TreeValidationError } from "./helpers";
import { dev } from "../../common/logging";
import {
  createSemanticError,
  type InterpretationError,
} from "../../common/errors";

export interface CaseTreeViewProps {
  tupleName: string;
  tupleArity: number;
  setErrorOverride: (error: InterpretationError | null) => void;
}

export default function CaseTreeView({
  tupleName,
  setErrorOverride,
}: CaseTreeViewProps) {
  const dispatch = useAppDispatch();
  const rootId = useSelector(
    (state: RootState) => state.present.caseTreeView[tupleName]?.rootId,
  );

  const errors = useAppSelector((state) =>
    selectTreeNodeValidation(state, tupleName),
  );

  useEffect(() => {
    if (!rootId) dispatch(initializeTree({ tupleName }));
  }, [dispatch, rootId, tupleName]);

  useEffect(() => {
    const allErrors = Object.values(errors).flat();

    dev.log(allErrors);

    if (allErrors.length === 0) {
      setErrorOverride(null);
    } else {
      setErrorOverride(createSemanticError(allErrors[0].message));
    }
  }, [errors, setErrorOverride]);

  return (
    <div
      style={{
        overflowX: "auto",
        display: "flex",
        minHeight: "256px",
        alignItems: "center",
        justifyContent: "start",
      }}
    >
      {rootId && <CaseTreeNodeRenderer nodeId={rootId} tupleName={tupleName} />}
    </div>
  );
}

function Branch({
  parentId,
  idx,
  caseType,
  branch,
  tupleName,
  isInvalid,
}: {
  parentId: string;
  idx: number;
  caseType: "case" | "default";
  branch: CaseTreeBranch;
  tupleName: string;
  isInvalid?: boolean;
}) {
  const dispatch = useAppDispatch();

  if (branch.type === "value") {
    return (
      <div
        style={{ padding: "4px 8px", display: "flex", alignItems: "center" }}
      >
        <FormControl
          value={branch.value}
          size="sm"
          style={{ maxWidth: "3rem", minWidth: "2rem" }}
          isInvalid={isInvalid}
          onChange={(e) =>
            dispatch(
              updateBranch({
                tupleName,
                nodeId: parentId,
                caseIdx: caseType === "case" ? idx : undefined,
                branch: { type: "value", value: e.target.value },
              }),
            )
          }
        />
      </div>
    );
  }

  return <CaseTreeNodeRenderer nodeId={branch.nodeId} tupleName={tupleName} />;
}

const getErrorByScope = <S extends TreeValidationError["scope"]>(
  errors: TreeValidationError[],
  scope: S,
  match?: Omit<Extract<TreeValidationError, { scope: S }>, "scope" | "message">,
) =>
  errors.find(
    (e): e is Extract<TreeValidationError, { scope: S }> =>
      e.scope === scope &&
      (!match ||
        Object.entries(match).every(([k, v]) => e[k as keyof typeof e] === v)),
  );

function CaseTreeNodeRenderer({
  nodeId,
  tupleName,
}: {
  nodeId: string;
  tupleName: string;
}) {
  const node = useAppSelector(
    (state) => state.present.caseTreeView[tupleName].nodes[nodeId],
  );

  const errors =
    useAppSelector((state) => selectTreeNodeValidation(state, tupleName))[
      nodeId
    ] ?? [];

  const arms = [
    ...node.cases.map((c) => ({ type: "case" as const, ...c })),
    { type: "default" as const, branch: node.default },
  ];

  return (
    <div
      className="case-tree-node"
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto 1fr",
        gridTemplateRows: `repeat(${arms.length}, auto)`,

        borderLeft: nodeId !== "root" ? "1px solid var(--bs-border-color)" : "",
      }}
    >
      <SwitchNode
        tupleName={tupleName}
        nodeId={nodeId}
        childrenCount={arms.length}
        errors={errors}
        node={node}
      />
      <>
        {arms.length > 1 &&
          arms.map((arm, idx) => (
            <Fragment key={idx}>
              <CaseBranch
                tupleName={tupleName}
                nodeId={nodeId}
                caseIdx={idx}
                canAdd={idx === arms.length - 2}
                errors={errors}
                arm={arm}
              />

              <div
                style={{
                  gridRow: idx + 1,
                  gridColumn: 3,
                  display: "flex",
                  alignItems: "start",
                  justifyContent: "start",
                }}
              >
                {arm.branch ? (
                  <Branch
                    tupleName={tupleName}
                    parentId={nodeId}
                    idx={idx}
                    branch={arm.branch}
                    caseType={arm.type}
                    isInvalid={
                      !!getErrorByScope(errors, "case", {
                        caseIdx: idx,
                        location: "value",
                      })
                    }
                  />
                ) : (
                  <CaseTreeAddButton
                    tupleName={tupleName}
                    parentId={nodeId}
                    caseType="default"
                    canDelete={false}
                  />
                )}
              </div>
            </Fragment>
          ))}

        {arms.length <= 1 && (
          <CaseTreeAddButton
            tupleName={tupleName}
            parentId={nodeId}
            caseType="case"
            canDelete={false}
          />
        )}
      </>
    </div>
  );
}

interface SwitchNodeProps {
  tupleName: string;
  nodeId: string;
  childrenCount: number;
  node: CaseTreeNode;
  errors: TreeValidationError[];
}

function SwitchNode({
  tupleName,
  nodeId,
  node,
  childrenCount,
  errors,
}: SwitchNodeProps) {
  const dispatch = useAppDispatch();

  return (
    <div
      style={{
        gridRow: `1 / ${childrenCount + 1}`,
        gridColumn: 1,
        display: "flex",
        alignItems: "start",
        padding: "4px 8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        switch |
        {
          <FormControl
            value={node.variable}
            size="sm"
            style={{ maxWidth: "3rem", minWidth: "2rem" }}
            isInvalid={!!getErrorByScope(errors, "variable")}
            onChange={(e) =>
              dispatch(
                updateNode({ tupleName, nodeId, variable: e.target.value }),
              )
            }
          />
        }
        |:
      </div>
    </div>
  );
}

interface CaseBranchProps {
  tupleName: string;
  nodeId: string;
  caseIdx: number;
  arm:
    | { type: "case"; match: string; branch: CaseTreeBranch }
    | { type: "default"; branch: CaseTreeBranch | undefined };
  canAdd: boolean;
  errors: TreeValidationError[];
}

function CaseBranch({
  tupleName,
  nodeId,
  caseIdx,
  arm,
  canAdd,
  errors,
}: CaseBranchProps) {
  const dispatch = useAppDispatch();
  const [hovered, setHovered] = useState(false);

  const switchExhausted = useAppSelector((state) =>
    selectSwitchExhausted(state, tupleName, nodeId),
  );

  return (
    <div
      style={{
        gridRow: caseIdx + 1,
        gridColumn: 2,
        padding: "4px 8px",
        gap: "0.25rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {arm.type === "case" ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.25rem",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
            }}
          >
            case
            {
              <FormControl
                value={arm.match}
                size="sm"
                isInvalid={
                  !!getErrorByScope(errors, "case", {
                    caseIdx,
                    location: "match",
                  })
                }
                style={{ maxWidth: "3rem", minWidth: "2rem" }}
                onChange={(e) =>
                  dispatch(
                    updateCase({
                      tupleName,
                      nodeId,
                      caseIdx,
                      match: e.target.value,
                    }),
                  )
                }
              />
            }
            :
          </div>
        </div>
      ) : (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "start",
            color: getErrorByScope(errors, "default") ? "var(--bs-danger)" : "",
          }}
        >
          default:
        </div>
      )}

      {hovered &&
        (arm.type !== "default" || !getErrorByScope(errors, "default")) && (
          <div>
            <CaseTreeAddButton
              tupleName={tupleName}
              parentId={nodeId}
              caseType={arm.type}
              caseIdx={caseIdx}
              canAdd={canAdd && !switchExhausted}
            />
          </div>
        )}
    </div>
  );
}

interface CaseTreeAddButtonProps {
  tupleName: string;
  parentId: string;
  caseType: "default" | "case";
  caseIdx?: number;
  canDelete?: boolean;
  canAdd?: boolean;
}

function CaseTreeAddButton({
  tupleName,
  parentId,
  caseType,
  caseIdx,
  canAdd = true,
  canDelete = true,
}: CaseTreeAddButtonProps) {
  const dispatch = useAppDispatch();
  const maxDepthReached = useAppSelector((state) =>
    selectMaxDepthReached(state, tupleName, parentId),
  );

  const items = [
    { text: "Value", branchType: "value" as const },
    { text: "Switch", branchType: "ref" as const },
  ];

  if (maxDepthReached) items.pop();

  return (
    <div style={{ display: "flex", gap: "0.5rem", margin: "4px 8px" }}>
      {canAdd && (
        <Dropdown>
          <Dropdown.Toggle
            as={Button}
            size="sm"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              padding: 0,
              width: "1.5rem",
              height: "1.5rem",
              borderRadius: "9999px",
            }}
            className="btn-bd-light-outline no-caret"
          >
            <FontAwesomeIcon icon={faPlus} size="sm" />
          </Dropdown.Toggle>

          <Dropdown.Menu>
            {items.map(({ text, branchType }) => (
              <Dropdown.Item
                key={text}
                as={Button}
                onClick={() =>
                  dispatch(
                    addCase({ parentId, tupleName, branchType, caseType }),
                  )
                }
              >
                {text}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      )}

      {canDelete && (
        <Button
          size="sm"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            padding: 0,
            width: "1.5rem",
            height: "1.5rem",
            borderRadius: "9999px",
          }}
          className="btn-bd-light-outline"
          onClick={() =>
            dispatch(deleteCase({ tupleName, parentId, caseType, caseIdx }))
          }
        >
          <FontAwesomeIcon icon={faTrash} size="sm" />
        </Button>
      )}
    </div>
  );
}
