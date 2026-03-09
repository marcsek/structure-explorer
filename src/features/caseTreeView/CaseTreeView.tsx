import "./CaseTreeView.css";

import { Fragment, useEffect, useState, useMemo } from "react";
import {
  addCase,
  deleteCase,
  initializeTree,
  selectStructuredCaseView,
  updateBranch,
  updateCase,
  updateNode,
} from "./caseTreeViewSlice";
import { Button, Dropdown, FormControl } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  getAllCaseViewErrors,
  type CaseViewBranch,
  type CaseViewCase,
  type CaseViewSwitch,
  type TreeSwitchError,
} from "./helpers";
import {
  createSemanticError,
  type InterpretationError,
} from "../../common/errors";
import { dev } from "../../common/logging";

export interface CaseTreeViewProps {
  tupleName: string;
  tupleArity: number;
  setErrorOverride: (error: InterpretationError | null) => void;
}

export default function CaseTreeView({
  tupleName,
  tupleArity,
  setErrorOverride,
}: CaseTreeViewProps) {
  const dispatch = useAppDispatch();
  const rootCaseViewSwitch = useAppSelector((state) =>
    selectStructuredCaseView(state, tupleName),
  );

  const allErrors = useMemo(
    () => (rootCaseViewSwitch ? getAllCaseViewErrors(rootCaseViewSwitch) : []),
    [rootCaseViewSwitch],
  );

  useEffect(() => {
    if (!rootCaseViewSwitch) dispatch(initializeTree({ tupleName }));
  }, [dispatch, rootCaseViewSwitch, tupleName]);

  useEffect(() => {
    dev.log(allErrors);

    if (allErrors.length === 0) setErrorOverride(null);
    else setErrorOverride(createSemanticError(allErrors[0]));
  }, [allErrors, setErrorOverride]);

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
      {rootCaseViewSwitch && (
        <CaseTreeNodeRenderer
          {...rootCaseViewSwitch}
          tupleName={tupleName}
          maxDepth={tupleArity}
        />
      )}
    </div>
  );
}

function Branch({
  parentId,
  idx,
  caseType,
  branch,
  tupleName,
  maxDepth,
  exhausted,
}: {
  parentId: string;
  idx: number;
  caseType: "case" | "default";
  branch: CaseViewBranch;
  tupleName: string;
  maxDepth: number;
  exhausted: boolean;
}) {
  const dispatch = useAppDispatch();

  if (branch.type === "value") {
    return (
      <div
        style={{
          padding: "4px 8px",
          display: "flex",
          alignItems: "center",
          opacity: exhausted ? 0.3 : 1,
        }}
      >
        <FormControl
          value={branch.value}
          size="sm"
          style={{ maxWidth: "3rem", minWidth: "2rem" }}
          isInvalid={!!branch.error}
          disabled={exhausted}
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

  return (
    <CaseTreeNodeRenderer
      {...branch.switch}
      tupleName={tupleName}
      maxDepth={maxDepth}
      parentExhausted={exhausted}
    />
  );
}

function CaseTreeNodeRenderer({
  id,
  variable,
  cases,
  errors,
  exhausted,
  tupleName,
  depth,
  maxDepth,
  parentExhausted = false,
}: CaseViewSwitch & {
  tupleName: string;
  maxDepth: number;
  parentExhausted?: boolean;
}) {
  return (
    <div
      className="case-tree-node"
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto 1fr",
        gridTemplateRows: `repeat(${cases.length}, auto)`,

        borderLeft: id !== "root" ? "1px solid var(--bs-border-color)" : "",
      }}
    >
      <SwitchNode
        tupleName={tupleName}
        nodeId={id}
        childrenCount={cases.length}
        errors={errors}
        variable={variable}
        exhausted={parentExhausted}
      />
      <>
        {cases.length > 1 &&
          cases.map((switchCase, idx) => (
            <Fragment key={idx}>
              <CaseBranch
                tupleName={tupleName}
                nodeId={id}
                caseIdx={idx}
                canAdd={idx === cases.length - 2 && !exhausted}
                exhausted={
                  parentExhausted ||
                  (switchCase.type === "default" && exhausted)
                }
                parentCase={switchCase}
                maxDepthReached={depth >= maxDepth}
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
                {switchCase.branch ? (
                  <Branch
                    tupleName={tupleName}
                    parentId={id}
                    idx={idx}
                    branch={switchCase.branch}
                    caseType={switchCase.type}
                    maxDepth={maxDepth}
                    exhausted={
                      parentExhausted ||
                      (switchCase.type === "default" && exhausted)
                    }
                  />
                ) : (
                  <CaseTreeAddButton
                    tupleName={tupleName}
                    parentId={id}
                    caseType="default"
                    canDelete={false}
                    maxDepthReached={depth >= maxDepth}
                  />
                )}
              </div>
            </Fragment>
          ))}

        {cases.length <= 1 && (
          <CaseTreeAddButton
            tupleName={tupleName}
            parentId={id}
            caseType="case"
            canDelete={false}
            maxDepthReached={depth >= maxDepth}
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
  variable: string;
  errors: TreeSwitchError[];
  exhausted: boolean;
}

function SwitchNode({
  tupleName,
  nodeId,
  childrenCount,
  errors,
  variable,
  exhausted,
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
          opacity: exhausted ? 0.3 : 1,
        }}
      >
        switch |
        {
          <FormControl
            value={variable}
            size="sm"
            style={{ maxWidth: "3rem", minWidth: "2rem" }}
            isInvalid={!!errors.find(({ scope }) => scope === "variable")}
            disabled={exhausted}
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
  parentCase: CaseViewCase;
  canAdd: boolean;
  maxDepthReached: boolean;
  exhausted: boolean;
}

function CaseBranch({
  tupleName,
  nodeId,
  caseIdx,
  parentCase,
  canAdd,
  maxDepthReached,
  exhausted,
}: CaseBranchProps) {
  const dispatch = useAppDispatch();
  const [hovered, setHovered] = useState(false);

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
        opacity: exhausted ? 0.3 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {parentCase.type === "case" ? (
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
                value={parentCase.match}
                size="sm"
                disabled={exhausted}
                isInvalid={!!parentCase.error}
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
            color: parentCase.error ? "var(--bs-danger)" : "",
          }}
        >
          default:
        </div>
      )}

      {hovered && (parentCase.type !== "default" || !parentCase.error) && (
        <div>
          <CaseTreeAddButton
            tupleName={tupleName}
            parentId={nodeId}
            caseType={parentCase.type}
            caseIdx={caseIdx}
            canAdd={canAdd}
            maxDepthReached={maxDepthReached}
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
  maxDepthReached: boolean;
}

function CaseTreeAddButton({
  tupleName,
  parentId,
  caseType,
  caseIdx,
  canAdd = true,
  canDelete = true,
  maxDepthReached = false,
}: CaseTreeAddButtonProps) {
  const dispatch = useAppDispatch();

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
