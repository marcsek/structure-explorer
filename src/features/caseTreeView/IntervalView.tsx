import "./IntervalView.css";

import { useEffect } from "react";
import {
  addCase,
  deleteCase,
  initializeTree,
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
import { Button, Dropdown, FormControl, Stack } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faTrash } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { InlineMath } from "react-katex";

export interface IntervalViewProps {
  tupleName: string;
  tupleArity: number;
}

export default function IntervalView({
  tupleName,
  tupleArity,
}: IntervalViewProps) {
  const dispatch = useAppDispatch();
  const intervalViewRows = useAppSelector((state) =>
    selectStructuredCaseView(state, tupleName),
  );

  useEffect(() => {
    if (!intervalViewRows) dispatch(initializeTree({ tupleName }));
  }, [dispatch, intervalViewRows, tupleName]);

  const rootIsExhausted = intervalViewRows?.at(-1)?.exhausted ?? false;

  return (
    <Stack
      direction="horizontal"
      gap={2}
      style={{
        overflowX: "auto",
        padding: "1rem",
        alignItems: "stretch",
        minHeight: "164px",
      }}
    >
      <div style={{ alignSelf: "center" }}>
        <InlineMath>{`i(f)(${intervalVariables.slice(0, tupleArity)}) = `}</InlineMath>
      </div>
      <CasesBrace />
      <Stack gap={2} style={{ height: "fit-content", alignSelf: "center" }}>
        {intervalViewRows &&
          intervalViewRows.map((row, idx) => (
            <IntervalViewRow
              tupleName={tupleName}
              tupleArity={tupleArity}
              row={row}
              key={idx}
            />
          ))}

        {!rootIsExhausted && (
          <Button
            size="sm"
            className="btn-bd-light"
            style={{ width: "fit-content" }}
            onClick={() =>
              dispatch(
                addCase({
                  parentId: "root",
                  tupleName,
                  caseType: "case",
                  branchType: "value",
                }),
              )
            }
          >
            <FontAwesomeIcon icon={faAdd} />
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

export function IntervalViewRow({
  row,
  tupleName,
  tupleArity,
}: {
  tupleName: string;
  tupleArity: number;
  row: IntervalViewRow;
}) {
  const { value, nodes, error: rowError, exhausted } = row;

  const dispatch = useAppDispatch();

  const lastNode = nodes.at(-1);
  if (!lastNode) return null;

  const isDeletable = (viewCase: IntervalViewCase) =>
    viewCase.type === "match" || viewCase.deletable;

  const handleCaseDelete = (viewCase: IntervalViewCase, nodeIdx: number) => {
    const node = nodes[nodeIdx];

    if (viewCase.type === "match") {
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

    const previousNode = nodes.at(nodeIdx - 1);
    if (!previousNode) return;

    const { id, case: parentViewCase } = previousNode;

    const caseType = parentViewCase.type === "match" ? "case" : "default";
    const caseIdx =
      parentViewCase.type === "match" ? parentViewCase.caseIdx : undefined;

    dispatch(deleteCase({ parentId: id, tupleName, caseType, caseIdx }));
  };

  const items = [
    { text: "Condition", branchType: "ref" as const },
    { text: "Variant", branchType: "value" as const },
  ];

  if (tupleArity <= nodes.length) items.shift();

  const errors = getAllIntervalViewRowErrors(row);

  const isExhausted = exhausted && nodes.some((n) => n.case.type === "default");

  return (
    <div className="interval-view-row">
      <Stack
        direction="horizontal"
        gap={1}
        style={{ opacity: isExhausted ? 0.6 : 1 }}
      >
        <FormControl
          value={value}
          size="sm"
          disabled={isExhausted}
          style={{ maxWidth: "3rem", minWidth: "2rem" }}
          isInvalid={!!rowError}
          onChange={(e) =>
            dispatch(
              updateBranch({
                nodeId: lastNode.id,
                tupleName,
                branch: { type: "value", value: e.target.value },
                caseIdx:
                  lastNode.case.type === "match"
                    ? lastNode.case.caseIdx
                    : undefined,
              }),
            )
          }
        />

        <span>if</span>

        {nodes.map(({ id, case: caseNode, variable, errors }, idx) => (
          <React.Fragment key={id}>
            <FormControl
              value={variable}
              size="sm"
              disabled={isExhausted}
              style={{ maxWidth: "3rem", minWidth: "2rem" }}
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

            <span>=</span>

            {caseNode.type === "match" ? (
              <FormControl
                value={caseNode.match}
                size="sm"
                disabled={isExhausted}
                style={{ maxWidth: "3rem", minWidth: "2rem" }}
                isInvalid={!!caseNode.error}
                onChange={(e) =>
                  dispatch(
                    updateCase({
                      nodeId: id,
                      tupleName,
                      caseIdx: caseNode.caseIdx,
                      match: e.target.value,
                    }),
                  )
                }
              />
            ) : (
              <span>any other</span>
            )}

            {idx === nodes.length - 1 ? (
              <>
                <Dropdown>
                  <Dropdown.Toggle
                    as={Button}
                    size="sm"
                    className="btn-bd-light no-caret"
                  >
                    <FontAwesomeIcon icon={faAdd} />
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {items.map(({ text, branchType }) => (
                      <Dropdown.Item
                        key={text}
                        as={Button}
                        onClick={() =>
                          dispatch(
                            addCase({
                              parentId: id,
                              tupleName,
                              caseType:
                                branchType === "value" ||
                                caseNode.type === "match"
                                  ? "case"
                                  : "default",
                              branchType,
                              caseIdx:
                                branchType === "ref" &&
                                caseNode.type === "match"
                                  ? caseNode.caseIdx
                                  : undefined,
                            }),
                          )
                        }
                      >
                        {text}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                {isDeletable(caseNode) && (
                  <Button
                    size="sm"
                    className="btn-bd-light"
                    onClick={() => handleCaseDelete(caseNode, idx)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                )}
              </>
            ) : (
              <span>,</span>
            )}
          </React.Fragment>
        ))}
      </Stack>

      {errors.length > 0 && (
        <p style={{ fontSize: "0.875rem" }} className="text-danger m-0">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

function CasesBrace() {
  return (
    <svg
      width="16"
      viewBox="0 0 12 100"
      preserveAspectRatio="none"
      style={{
        display: "block",
        width: "1rem",
        flexShrink: "0",
      }}
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
