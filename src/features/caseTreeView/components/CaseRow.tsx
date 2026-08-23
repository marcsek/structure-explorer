import { FormControl, Stack } from "react-bootstrap";
import CaseButtons from "./CaseButtons";
import CaseCondition from "./CaseCondition";
import { useAppDispatch } from "../../../app/hooks";
import { appendCase, editCaseTree } from "../caseTreeViewSlice";
import { getCasePathErrors, type CasePath } from "../model/flattenTree";
import {
  caseRefOf,
  getDisplayNodes,
  getRemoveRef,
  getUnusedVars,
} from "../model/caseRow";

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

  const { value, error, placeholder, exhausted } = path;
  const lastNode = path.nodes.at(-1);

  if (!lastNode) return null;
  if (placeholder && (locked || exhausted)) return null;

  const flags = { placeholder, locked };
  const rowErrors = getCasePathErrors(path);
  const nodes = getDisplayNodes(path);
  const unusedVars = getUnusedVars(nodes, allowedVars);

  const hasExhaustedVar =
    nodes.some((n) => n.exhausted) && !placeholder && rowErrors.length === 0;

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
    hasExhaustedVar && "exhausted",
    locked && "locked",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rowClass}>
      <Stack direction="horizontal" gap={1} className="case-tree-view-row-stack">
        <FormControl
          value={value}
          size="sm"
          disabled={locked || (placeholder && exhausted)}
          isInvalid={!!error}
          onChange={(e) => handleValueChange(e.target.value)}
        />

        <span>if</span>

        {nodes.map((node, idx) => {
          const isLast = idx === nodes.length - 1;

          return (
            <Stack
              key={isLast ? "last-node" : node.id}
              direction="horizontal"
              className="case-tree-view-node-stack"
              gap={1}
            >
              <CaseCondition
                node={node}
                functionName={functionName}
                appendNodeId={lastNode.id}
                isLast={isLast}
                flags={flags}
              />

              {!isLast && <span>,</span>}

              {isLast && !locked && !placeholder && (
                <CaseButtons
                  functionName={functionName}
                  variables={unusedVars}
                  branchTarget={{ kind: "nested", ref: caseRefOf(node) }}
                  removeRef={getRemoveRef(path.nodes, idx)}
                />
              )}

              {node.exhausted && rowErrors.length === 0 && !placeholder && (
                <span className="exhaust-message">
                  all cases for <var>{node.variable}</var> covered
                </span>
              )}
            </Stack>
          );
        })}
      </Stack>

      {rowErrors.length > 0 && <p className="error-message">{rowErrors[0]}</p>}
    </div>
  );
}
