import { FormControl, OverlayTrigger, Tooltip } from "react-bootstrap";
import { InlineMath } from "react-katex";
import ResizeInput from "./ResizeInput";
import { useAppDispatch } from "../../../app/hooks";
import { appendCase, editCaseTree } from "../caseTreeViewSlice";
import type { CasePathNode } from "../model/flattenTree";

export default function CaseCondition({
  node,
  functionName,
  placeholder,
  locked,
}: {
  node: CasePathNode;
  functionName: string;
  placeholder: boolean;
  locked: boolean;
}) {
  const dispatch = useAppDispatch();

  if (node.case.type === "default") {
    const { leftoverMatches } = node.case;

    return (
      <OverlayTrigger
        placement="top"
        delay={{ show: 200, hide: 0 }}
        overlay={
          <Tooltip
            className="custom-bs-tooltip lg"
            id={`tooltip-default-${node.id}`}
          >
            <span className="any-other-tootlip-label">
              <var>{node.variable}</var>
              {` ∈ {${leftoverMatches.join(",")}}`}
            </span>
          </Tooltip>
        }
      >
        <span className="any-other-label">
          <var>{node.variable}</var>
          <span>is any other</span>
        </span>
      </OverlayTrigger>
    );
  }

  const nodeCase = node.case;

  const handleMatchChange = (match: string) =>
    dispatch(
      placeholder
        ? appendCase({
            functionName,
            target: { kind: "appendMatch", nodeId: node.id },
            value: match,
          })
        : editCaseTree({
            functionName,
            target: {
              kind: "match",
              nodeId: node.id,
              caseIdx: nodeCase.caseIdx,
            },
            value: match,
          }),
    );

  return (
    <>
      <FormControl
        value={node.variable}
        size="sm"
        className="case-tree-view-input case-tree-view-variable-input"
        disabled={locked || !node.firstOccurence}
        isInvalid={!!node.error}
        onChange={(e) =>
          dispatch(
            editCaseTree({
              functionName,
              target: { kind: "variable", nodeId: node.id },
              value: e.target.value,
            }),
          )
        }
      />

      <InlineMath>{"\\in"}</InlineMath>

      <div className="case-tree-view-match-group">
        <InlineMath>{"\\{"}</InlineMath>
        <ResizeInput
          className="case-tree-view-input case-tree-view-match-input"
          value={nodeCase.match}
          size="sm"
          disabled={locked || !nodeCase.firstOccurence}
          isInvalid={!!nodeCase.error}
          onChange={(e) => handleMatchChange(e.target.value)}
        />
        <InlineMath>{"\\}"}</InlineMath>
      </div>
    </>
  );
}
