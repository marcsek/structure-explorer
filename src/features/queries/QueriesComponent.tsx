import { Button, Stack } from "react-bootstrap";
import { InlineMath } from "react-katex";
import ComponentCard from "../../components_helper/ComponentCard/ComponentCard.tsx";
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

/* eslint-disable */
const help = <>You get no help!</>;
