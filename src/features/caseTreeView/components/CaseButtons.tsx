import { Button, ButtonGroup, Dropdown } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch } from "../../../app/hooks";
import { branchVariable, deleteCase } from "../caseTreeViewSlice";
import type { BranchTarget, CaseRef } from "../model/targets";

export default function CaseButtons({
  functionName,
  variables,
  branchTarget,
  removeRef,
}: {
  functionName: string;
  variables: string[];
  branchTarget: BranchTarget;
  removeRef: CaseRef | null;
}) {
  const dispatch = useAppDispatch();

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
                size="sm"
                onClick={() =>
                  dispatch(
                    branchVariable({
                      functionName,
                      target: branchTarget,
                      variable: v,
                    }),
                  )
                }
              >
                <var>{v}</var>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      )}

      {removeRef && (
        <Button
          size="sm"
          className="btn-bd-light-outline"
          onClick={() => dispatch(deleteCase({ functionName, ref: removeRef }))}
        >
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      )}
    </ButtonGroup>
  );
}
