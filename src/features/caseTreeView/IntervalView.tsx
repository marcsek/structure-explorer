import "./IntervalView.css";

import { useEffect } from "react";
import {
  addCase,
  addInitialCase,
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
import { latex } from "../../common/utils";

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
    if (!intervalViewRows) dispatch(initializeTree(tupleName));
  }, [dispatch, intervalViewRows, tupleName]);

  if (!intervalViewRows) return null;

  const pureIntervalViewRows = intervalViewRows.filter((r) => !r.placeholder);
  const hasSigleBranch =
    pureIntervalViewRows.length === 1 &&
    pureIntervalViewRows[0].nodes.length === 1;

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
        <InlineMath>{`i(${latex().text(tupleName).get()})(${intervalVariables.slice(0, tupleArity)}) = `}</InlineMath>
      </div>

      <CasesBrace />

      <Stack gap={2} style={{ height: "fit-content", alignSelf: "center" }}>
        {hasSigleBranch ? (
          <SingleValueIntervalInput
            actualRow={pureIntervalViewRows[0]}
            tupleName={tupleName}
            tupleArity={tupleArity}
          />
        ) : (
          intervalViewRows.map((row, idx) => (
            <IntervalViewRow
              tupleName={tupleName}
              tupleArity={tupleArity}
              row={row}
              key={idx}
            />
          ))
        )}
      </Stack>
    </Stack>
  );
}

export function SingleValueIntervalInput({
  actualRow,
  tupleName,
  tupleArity,
}: {
  actualRow: IntervalViewRow;
  tupleName: string;
  tupleArity: number;
}) {
  const dispatch = useAppDispatch();

  const { value, error, nodes } = actualRow;

  const firstNode = nodes.at(0);
  if (!firstNode) return null;

  return (
    <Stack direction="horizontal" gap={1}>
      <FormControl
        value={value}
        size="sm"
        style={{ maxWidth: "3rem", minWidth: "2rem" }}
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
      <CaseButtons
        caseNode={firstNode.case}
        parentId={firstNode.id}
        tupleName={tupleName}
        onCaseDelete={() => {}}
        maxDepthReached={false}
        variables={intervalVariables.slice(0, tupleArity)}
        initialCase
      />
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
  const { value, nodes: actualNodes, error: rowError, placeholder } = row;

  const dispatch = useAppDispatch();

  const lastNode = actualNodes.at(-1);
  if (!lastNode) return null;

  const errors = getAllIntervalViewRowErrors(row);

  const nodes = [...actualNodes];

  if (placeholder) {
    nodes.pop();
    nodes.push({
      primary: false,
      variable: lastNode.variable,
      case: { type: "case", caseIdx: 0, error: "", match: "" },
      errors: [],
      id: "",
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

  return (
    <div className="interval-view-row">
      <Stack
        direction="horizontal"
        gap={1}
        style={{ opacity: placeholder ? 0.6 : 1 }}
      >
        <FormControl
          value={value}
          size="sm"
          style={{ maxWidth: "3rem", minWidth: "2rem" }}
          isInvalid={!!rowError}
          onChange={(e) =>
            placeholder
              ? dispatch(
                  addCase({
                    parentId: lastNode.id,
                    caseType: "case",
                    branchType: "value",
                    tupleName,
                    value: e.target.value,
                  }),
                )
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

        {nodes.map(({ id, case: caseNode, variable, errors, primary }, idx) => (
          <React.Fragment key={idx < nodes.length - 1 ? id : "last-node"}>
            {caseNode.type === "case" ? (
              <>
                <FormControl
                  value={variable}
                  size="sm"
                  disabled={!primary || placeholder}
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

                <FormControl
                  value={
                    !placeholder || idx < nodes.length - 1 ? caseNode.match : ""
                  }
                  size="sm"
                  disabled={placeholder && idx < nodes.length - 1}
                  style={{ maxWidth: "3rem", minWidth: "2rem" }}
                  isInvalid={!!caseNode.error}
                  onChange={(e) =>
                    placeholder
                      ? dispatch(
                          addCase({
                            parentId: lastNode.id,
                            caseType: "case",
                            branchType: "value",
                            tupleName,
                            match: e.target.value,
                          }),
                        )
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
              </>
            ) : (
              <span style={{ textWrap: "nowrap" }}>
                {variable} is any other
              </span>
            )}

            {(!placeholder || idx < nodes.length - 1) && (
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
  maxDepthReached,
  variables,
  onCaseDelete,
  initialCase = false,
}: CaseButtonsProps) {
  const dispatch = useAppDispatch();

  const dropdownItems = [
    { text: "Condition", branchType: "ref" as const },
    { text: "Variant", branchType: "value" as const },
  ];

  if (maxDepthReached) dropdownItems.shift();

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
    <>
      {variables.length > 0 && (
        <Dropdown>
          <Dropdown.Toggle as={Button} size="sm" className="btn-bd-light">
            <FontAwesomeIcon icon={faAdd} />
          </Dropdown.Toggle>

          <Dropdown.Menu>
            {variables.map((v) => (
              <Dropdown.Item
                key={v}
                as={Button}
                onClick={() => handleAddCase(v)}
                size="sm"
              >
                {v}
              </Dropdown.Item>
            ))}

            {/* {dropdownItems.map(({ text, branchType }) => ( */}
            {/*   <Dropdown.Item */}
            {/*     key={text} */}
            {/*     as={Button} */}
            {/*     onClick={() => */}
            {/*       dispatch( */}
            {/*         addCase({ */}
            {/*           parentId, */}
            {/*           tupleName, */}
            {/*           caseType: */}
            {/*             branchType === "value" || caseNode.type === "case" */}
            {/*               ? "case" */}
            {/*               : "default", */}
            {/*           branchType, */}
            {/*           caseIdx: */}
            {/*             branchType === "ref" && caseNode.type === "case" */}
            {/*               ? caseNode.caseIdx */}
            {/*               : undefined, */}
            {/*         }), */}
            {/*       ) */}
            {/*     } */}
            {/*   > */}
            {/*     {text} */}
            {/*   </Dropdown.Item> */}
            {/* ))} */}
          </Dropdown.Menu>
        </Dropdown>
      )}

      {isDeletable(caseNode) && (
        <Button size="sm" className="btn-bd-light" onClick={onCaseDelete}>
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      )}
    </>
  );
}

function CasesBrace() {
  return (
    <svg
      width="16"
      viewBox="0 0 12 100"
      preserveAspectRatio="none"
      style={{ display: "block", width: "1rem", flexShrink: "0" }}
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
