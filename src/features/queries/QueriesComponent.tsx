import { Button, Stack } from "react-bootstrap";
import { InlineMath } from "react-katex";
import ComponentCard from "../../layout/ComponentCard/ComponentCard.tsx";
import { useAppDispatch, useAppSelector } from "../../app/hooks.ts";
import { UndoActions } from "../undoHistory/undoHistory.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { addQuery, selectQueryIndexes } from "./queriesSlice.ts";
import QueryComponent from "./QueryComponent.tsx";

export default function QueriesComponent() {
  const dispatch = useAppDispatch();

  const queryIndexes = useAppSelector(selectQueryIndexes);

  return (
    <ComponentCard
      heading={
        <>
          Queries in <InlineMath>{"\\mathcal{M}"}</InlineMath>
        </>
      }
      className="formula-card"
      help={help}
    >
      <Stack
        gap={3}
        direction="vertical"
        className={`${queryIndexes.length > 0 ? "mb-3" : ""} flex-wrap formula-card-header`}
      >
        {queryIndexes.map((idx) => (
          <QueryComponent idx={idx} key={idx} />
        ))}
      </Stack>

      <Button
        variant="success"
        size="sm"
        onClick={() => {
          dispatch(addQuery());
          dispatch(UndoActions.checkpoint());
        }}
      >
        <FontAwesomeIcon icon={faPlus} /> Add
      </Button>
    </ComponentCard>
  );
}

const help = (
  <>
    <p>
      Queries allow you to find all assignments that satisfy a given open
      formula in the structure 𝓜.
    </p>
    <p>
      Each query is defined by a comma-separated list of{" "}
      <strong>query variables</strong> indicated on the left and an{" "}
      <strong>open formula</strong> on the right. The indicated variables must
      be <strong>free</strong> in the formula. All free variables of the formula
      must be indicated unless they are given a value by the global assignment
      𝑒.
    </p>
    <p>
      Pressing the <strong>Query</strong> button returns all possible
      assignments of the query variables that satisfy the formula.
    </p>
    <p className="mb-0">
      The syntax of formulas follows the same rules as in the{" "}
      <strong>Truth of formulas</strong> section (see its help for details).
    </p>
  </>
);
