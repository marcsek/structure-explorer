import "./IntervalView.css";

import { useEffect } from "react";
import {
  addCase,
  addInitialCase,
  deleteCase,
  initializeTree,
  regenerateInterpretation,
  selectStructuredCaseView,
  updateBranch,
  updateCase,
  updateNode,
} from "./caseTreeViewSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  getAllIntervalViewRowErrors,
  intervalVariables,
  type IntervalViewCase,
  type IntervalViewRow,
} from "./helpers";
import {
  Button,
  ButtonGroup,
  Dropdown,
  FormControl,
  OverlayTrigger,
  Stack,
  Tooltip,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faArrowsRotate,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { InlineMath } from "react-katex";
import { latex } from "../../shared/core/utils";
import {
  selectIfLock,
  selectValidatedFunction,
} from "../structure/structureSlice";
import { createValidationError } from "../../shared/core/errors";
import ResizeInput from "./ResizeInput";
import type { DrawerEditorProps } from "../drawerEditor/drawerEditorAdapter";

export default function IntervalView({
  tupleInfo,
  setErrorOverride,
}: DrawerEditorProps) {
  const { name: tupleName, arity: tupleArity } = tupleInfo;

  const dispatch = useAppDispatch();
  const intervalViewRows = useAppSelector((state) =>
    selectStructuredCaseView(state, tupleName),
  );
  const locked = useAppSelector((state) => selectIfLock(state, tupleName));

  const functionIntr = useAppSelector((state) =>
    selectValidatedFunction(state, tupleName),
  );

  useEffect(() => {
    if (!intervalViewRows) dispatch(initializeTree(tupleName));
  }, [dispatch, intervalViewRows, tupleName]);

  const errors =
    intervalViewRows?.flatMap((r) => getAllIntervalViewRowErrors(r)) ?? [];

  useEffect(() => {
    if ((functionIntr.error || !functionIntr.parsed) && errors.length === 0)
      setErrorOverride({
        editor: "caseTree",
        fixButton: (
          <>
            <FontAwesomeIcon icon={faArrowsRotate} /> Regenerate
          </>
        ),
        error: createValidationError(
          "This editor is out of sync due to errors in the interpretation. You can regenerate a valid interpretation.",
        ),
        onFixButtonClick: () => dispatch(regenerateInterpretation(tupleName)),
      });
    else setErrorOverride(null);
  }, [
    dispatch,
    errors.length,
    functionIntr.error,
    functionIntr.parsed,
    setErrorOverride,
    tupleName,
  ]);

  if (!intervalViewRows) return null;

  const pureIntervalViewRows = intervalViewRows.filter((r) => !r.placeholder);
  const hasSigleBranch =
    pureIntervalViewRows.length === 1 &&
    pureIntervalViewRows[0].nodes.length === 1 &&
    pureIntervalViewRows[0].nodes[0].case.type === "default";
  return (
    <div className="interval-view-wrapper">
      <Stack direction="horizontal" gap={2} className="interval-view">
        <div className="interval-view-label">
          <InlineMath>{`i(${latex().text(tupleName).get()})(${intervalVariables.slice(0, tupleArity)}) = `}</InlineMath>
        </div>

        <CasesBrace />

        <Stack gap={2} className="interval-view-branches">
          {hasSigleBranch ? (
            <SingleValueIntervalInput
              actualRow={pureIntervalViewRows[0]}
              tupleName={tupleName}
              tupleArity={tupleArity}
              locked={locked}
            />
          ) : (
            intervalViewRows.map((row, idx) => (
              <IntervalViewRow
                tupleName={tupleName}
                tupleArity={tupleArity}
                locked={locked}
                row={row}
                key={idx}
              />
            ))
          )}
        </Stack>
      </Stack>
    </div>
  );
}

export function SingleValueIntervalInput({
  actualRow,
  tupleName,
  tupleArity,
  locked,
}: {
  actualRow: IntervalViewRow;
  tupleName: string;
  tupleArity: number;
  locked: boolean;
}) {
  const dispatch = useAppDispatch();

  const { value, error, nodes } = actualRow;

  const firstNode = nodes.at(0);
  if (!firstNode) return null;

  return (
    <>
      <Stack direction="horizontal" gap={1} className="single-value-interval">
        <FormControl
          value={value}
          size="sm"
          className="interval-input"
          disabled={locked}
          isInvalid={!!error}
          onChange={(e) =>
            dispatch(
              updateBranch({
                nodeId: firstNode.id,
                tupleName,
                branch: { type: "value", value: e.target.value },
              }),
            )
          }
        />

        {!locked && (
          <CaseButtons
            caseNode={firstNode.case}
            parentId={firstNode.id}
            tupleName={tupleName}
            onCaseDelete={() => {}}
            maxDepthReached={false}
            variables={intervalVariables.slice(0, tupleArity)}
            initialCase
          />
        )}
      </Stack>

      {error && <p className="error-message text-danger m-0">{error}</p>}
    </>
  );
}

export function IntervalViewRow({
  row,
  tupleName,
  tupleArity,
  locked,
}: {
  tupleName: string;
  tupleArity: number;
  row: IntervalViewRow;
  locked: boolean;
}) {
  const {
    value,
    nodes: actualNodes,
    error: rowError,
    placeholder,
    exhausted,
  } = row;

  const dispatch = useAppDispatch();

  const lastNode = actualNodes.at(-1);

  if (!lastNode) return null;

  const rowErrors = getAllIntervalViewRowErrors(row);

  const nodes = [...actualNodes];

  if (placeholder && (locked || exhausted)) return null;

  if (placeholder) {
    nodes.pop();
    nodes.push({
      primary: false,
      variable: lastNode.variable,
      case: {
        type: "case",
        caseIdx: 0,
        error: "",
        match: "",
        primary: false,
      },
      errors: [],
      id: "",
      exhausted: false,
    });
  }

  const handleCaseDelete = (viewCase: IntervalViewCase, nodeIdx: number) => {
    const node = nodes[nodeIdx];

    if (viewCase.type === "case") {
      dispatch(
        deleteCase({
          parentId: node.id,
          tupleName,
          caseType: "case",
          caseIdx: viewCase.caseIdx,
        }),
      );
      return;
    }

    const previousNode = actualNodes.at(nodeIdx - 1);
    if (!previousNode) return;

    const { id: parentId, case: parentViewCase } = previousNode;

    const caseType = parentViewCase.type;
    const caseIdx = caseType === "case" ? parentViewCase.caseIdx : undefined;

    dispatch(deleteCase({ parentId, tupleName, caseType, caseIdx }));
  };

  const usedVars = nodes.map((n) => n.variable);
  const unusedVars = intervalVariables
    .slice(0, tupleArity)
    .filter((v) => !usedVars.includes(v));

  const handlePlaceholderUpdate = ({
    type,
    value,
  }: {
    type: "value" | "match";
    value: string;
  }) => {
    dispatch(
      addCase({
        parentId: lastNode.id,
        caseType: "case",
        branchType: "value",
        tupleName,
        [type]: value,
      }),
    );
  };

  const hasExhaustedVar =
    nodes.some((v) => v.exhausted) && !placeholder && rowErrors.length === 0;

  return (
    <div
      className={`interval-view-row ${placeholder ? "row-placeholder" : ""} ${hasExhaustedVar ? "exhausted" : ""} ${locked ? "locked" : ""}`}
    >
      <Stack direction="horizontal" gap={1} className="interval-view-row-stack">
        <FormControl
          value={value}
          size="sm"
          disabled={locked || (placeholder && exhausted)}
          isInvalid={!!rowError}
          onChange={(e) =>
            placeholder
              ? handlePlaceholderUpdate({
                  type: "value",
                  value: e.target.value,
                })
              : dispatch(
                  updateBranch({
                    nodeId: lastNode.id,
                    tupleName,
                    branch: { type: "value", value: e.target.value },
                    caseIdx:
                      lastNode.case.type === "case"
                        ? lastNode.case.caseIdx
                        : undefined,
                  }),
                )
          }
        />

        <span>if</span>

        {nodes.map(
          (
            { id, case: caseNode, variable, errors, primary, exhausted },
            idx,
          ) => (
            <Stack
              key={idx < nodes.length - 1 ? id : "last-node"}
              direction="horizontal"
              className="interval-view-node-stack"
              gap={1}
            >
              {caseNode.type === "case" ? (
                <>
                  <FormControl
                    value={variable}
                    size="sm"
                    disabled={!primary || placeholder || locked}
                    className={`interval-input interval-variable-input`}
                    isInvalid={errors.length > 0}
                    onChange={(e) =>
                      dispatch(
                        updateNode({
                          nodeId: id,
                          tupleName,
                          variable: e.target.value,
                        }),
                      )
                    }
                  />

                  <InlineMath>{"\\in"}</InlineMath>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexShrink: 0,
                      fontSize: "",
                      gap: "1px",
                    }}
                  >
                    <InlineMath>{"\\{"}</InlineMath>
                    <ResizeInput
                      className="interval-input interval-match-input"
                      value={
                        !placeholder || idx < nodes.length - 1
                          ? caseNode.match
                          : ""
                      }
                      size="sm"
                      disabled={
                        locked ||
                        (placeholder && exhausted) ||
                        ((placeholder || !caseNode.primary) &&
                          idx < nodes.length - 1)
                      }
                      isInvalid={!!caseNode.error}
                      onChange={(e) =>
                        placeholder
                          ? handlePlaceholderUpdate({
                              type: "match",
                              value: e.target.value,
                            })
                          : dispatch(
                              updateCase({
                                nodeId: id,
                                tupleName,
                                caseIdx: caseNode.caseIdx,
                                match: e.target.value,
                              }),
                            )
                      }
                    />
                    <InlineMath>{"\\}"}</InlineMath>
                  </div>
                </>
              ) : (
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 200, hide: 0 }}
                  overlay={
                    <Tooltip
                      className="custom-bs-tooltip lg"
                      id={`tooltip-default-${id}`}
                    >
                      <span className="any-other-tootlip-label">
                        <var>{variable}</var>
                        {` ∈ {${caseNode.leftoverMatches.join(",")}}`}
                      </span>
                    </Tooltip>
                  }
                >
                  <span className="any-other-label">
                    <var>{variable}</var>
                    <span>is any other</span>
                  </span>
                </OverlayTrigger>
              )}

              {((!locked && !placeholder) || idx < nodes.length - 1) && (
                <>
                  {idx === nodes.length - 1 ? (
                    <CaseButtons
                      caseNode={caseNode}
                      parentId={id}
                      tupleName={tupleName}
                      onCaseDelete={() => handleCaseDelete(caseNode, idx)}
                      maxDepthReached={tupleArity <= nodes.length}
                      variables={unusedVars}
                    />
                  ) : (
                    <span>,</span>
                  )}
                </>
              )}

              {exhausted && rowErrors.length === 0 && !placeholder && (
                <span className="exhaust-message">
                  all cases for <var>{variable}</var> covered
                </span>
              )}
            </Stack>
          ),
        )}
      </Stack>

      {rowErrors.length > 0 && <p className="error-message">{rowErrors[0]}</p>}
      {/* {exhaustedVars.length > 0 && errors.length === 0 && ( */}
      {/*   <span className="exhaust-message"> */}
      {/*     all cases for <var>{exhaustedVars.join(",")}</var> covered */}
      {/*   </span> */}
      {/* )} */}
    </div>
  );
}

interface CaseButtonsProps {
  tupleName: string;
  caseNode: IntervalViewCase;
  parentId: string;
  maxDepthReached: boolean;
  variables: string[];
  onCaseDelete: () => void;
  initialCase?: boolean;
}

function CaseButtons({
  tupleName,
  caseNode,
  parentId,
  variables,
  onCaseDelete,
  initialCase = false,
}: CaseButtonsProps) {
  const dispatch = useAppDispatch();

  const isDeletable = (viewCase: IntervalViewCase) =>
    viewCase.type === "case" || viewCase.deletable;

  const handleAddCase = (variable: string) => {
    if (initialCase) {
      return void dispatch(addInitialCase({ tupleName, variable }));
    }

    dispatch(
      addCase({
        parentId,
        tupleName,
        caseType: caseNode.type,
        branchType: "ref",
        caseIdx: caseNode.type === "case" ? caseNode.caseIdx : undefined,
        variable,
      }),
    );
  };

  return (
    <ButtonGroup size="sm" className="ms-1">
      {variables.length > 0 && (
        <Dropdown as={ButtonGroup}>
          <Dropdown.Toggle
            as={Button}
            size="sm"
            className="btn-bd-light-outline"
          >
            <FontAwesomeIcon icon={faAdd} />
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.ItemText className="drop-down-title-text">
              Cases for
            </Dropdown.ItemText>

            {variables.map((v) => (
              <Dropdown.Item
                key={v}
                as={Button}
                onClick={() => handleAddCase(v)}
                size="sm"
              >
                <var>{v}</var>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      )}

      {isDeletable(caseNode) && (
        <Button
          size="sm"
          className="btn-bd-light-outline"
          onClick={onCaseDelete}
        >
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      )}
    </ButtonGroup>
  );
}

function CasesBrace() {
  return (
    <svg
      width="16"
      viewBox="0 0 12 100"
      preserveAspectRatio="none"
      className="cases-brace"
    >
      <path
        d="M11 0 Q5 0 5 10 L5 40 Q5 50 0 50 Q5 50 5 60 L5 90 Q5 100 11 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
