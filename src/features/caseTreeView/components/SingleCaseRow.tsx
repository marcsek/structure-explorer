import { FormControl, Stack } from "react-bootstrap";
import CaseButtons from "./CaseButtons";
import { useAppDispatch } from "../../../app/hooks";
import { editCaseTree } from "../caseTreeViewSlice";
import type { CasePath } from "../model/flattenTree";
import { caseRefOf } from "../model/caseRow";

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
      <Stack
        direction="horizontal"
        gap={1}
        className="case-tree-view-single-value"
      >
        <FormControl
          value={path.value}
          size="sm"
          disabled={locked}
          isInvalid={!!path.valueError}
          onChange={(e) =>
            dispatch(
              editCaseTree({
                functionName,
                target: { kind: "value", ref: caseRefOf(node) },
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

      {path.valueError && <p className="error-message">{path.valueError}</p>}
    </>
  );
}
