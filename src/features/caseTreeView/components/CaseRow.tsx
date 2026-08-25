import { FormControl, Stack } from "react-bootstrap";
import CaseButtons from "./CaseButtons";
import CaseCondition from "./CaseCondition";
import { useAppDispatch } from "../../../app/hooks";
import { appendCase, editCaseTree } from "../caseTreeViewSlice";
import type { CasePath } from "../model/flattenTree";
import { caseRefOf, getRemoveRef, getUnusedVars } from "../model/caseRow";

export default function CaseRow({
  path,
  functionName,
  allowedVars,
  locked,
}: {
  path: CasePath;
  functionName: string;
  allowedVars: string[];
  locked: boolean;
}) {
  const dispatch = useAppDispatch();

  const { value, valueError, error, nodes, placeholder } = path;
  const lastNode = nodes.at(-1);

  if (!lastNode) return null;
  if (placeholder && locked) return null;

  const unusedVars = getUnusedVars(nodes, allowedVars);
  const showExhausted = !placeholder && error === "";

  const handleValueChange = (next: string) =>
    dispatch(
      placeholder
        ? appendCase({
            functionName,
            target: { kind: "appendValue", nodeId: lastNode.id },
            value: next,
          })
        : editCaseTree({
            functionName,
            target: { kind: "value", ref: caseRefOf(lastNode) },
            value: next,
          }),
    );

  const rowClass = [
    "case-tree-view-row",
    placeholder && "row-placeholder",
    showExhausted && nodes.some((n) => n.exhausted) && "exhausted",
    locked && "locked",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rowClass}>
      <Stack direction="horizontal" gap={1}>
        <FormControl
          value={value}
          size="sm"
          disabled={locked}
          isInvalid={!!valueError}
          onChange={(e) => handleValueChange(e.target.value)}
        />

        <span>if</span>

        {nodes.map((node, idx) => {
          const isLast = idx === nodes.length - 1;

          return (
            <Stack
              key={idx}
              direction="horizontal"
              className="case-tree-view-node-stack"
              gap={1}
            >
              <CaseCondition
                node={node}
                functionName={functionName}
                placeholder={placeholder}
                locked={locked}
              />

              {!isLast && <span>,</span>}

              {isLast && !locked && !placeholder && (
                <CaseButtons
                  functionName={functionName}
                  variables={unusedVars}
                  branchTarget={{ kind: "nested", ref: caseRefOf(node) }}
                  removeRef={getRemoveRef(nodes)}
                />
              )}

              {node.exhausted && showExhausted && (
                <span className="exhaust-message">
                  all cases for <var>{node.variable}</var> covered
                </span>
              )}
            </Stack>
          );
        })}
      </Stack>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
