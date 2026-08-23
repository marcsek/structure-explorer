import { FormControl, Stack } from "react-bootstrap";
import CaseButtons from "./CaseButtons";
import { useAppDispatch } from "../../../app/hooks";
import { editCaseTree } from "../caseTreeViewSlice";
import type { CasePath } from "../model/flattenTree";

export default function SingleCaseRow({
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
  const [node] = path.nodes;

  return (
    <>
      <Stack direction="horizontal" gap={1} className="case-tree-view-single-value">
        <FormControl
          value={path.value}
          size="sm"
          className="case-tree-view-input"
          disabled={locked}
          isInvalid={!!path.error}
          onChange={(e) =>
            dispatch(
              editCaseTree({
                functionName,
                target: {
                  kind: "value",
                  ref: { kind: "default", nodeId: node.id },
                },
                value: e.target.value,
              }),
            )
          }
        />

        {!locked && (
          <CaseButtons
            functionName={functionName}
            variables={allowedVars}
            branchTarget={{ kind: "initial" }}
            removeRef={null}
          />
        )}
      </Stack>

      {path.error && (
        <p className="error-message text-danger m-0">{path.error}</p>
      )}
    </>
  );
}
