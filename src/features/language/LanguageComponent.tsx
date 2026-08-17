import { Button, Stack } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { InlineMath } from "react-katex";
import {
  selectSymbolsClash,
  selectConstantsLock,
  selectPredicatesLock,
  selectFunctionsLock,
  lockPredicates,
  lockConstants,
  lockFunctions,
  editModeChanged,
} from "./languageSlice";
import ComponentCard from "../../layout/ComponentCard/ComponentCard.tsx";
import { selectValidatedTextView } from "../textView/textViewSlice.ts";
import TextView from "../textView/TextViewEditor.tsx";
import { useSyncLanguageContext } from "../../providers/logicContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { useInstanceId } from "../../providers/instanceIdContext.tsx";

export default function LanguageComponent() {
  const dispatch = useAppDispatch();

  const symbolsClash = useAppSelector(selectSymbolsClash);
  const { hasContext } = useSyncLanguageContext();
  const editMode = useAppSelector((state) => state.present.language.editMode);

  const instanceId = useInstanceId();

  return (
    <ComponentCard
      heading={
        <>
          Language <InlineMath>{String.raw`\mathcal{L}`}</InlineMath>
        </>
      }
      help={help}
      right={
        <Button
          size="sm"
          className="btn-bd-light-outline"
          onClick={() => dispatch(editModeChanged(!editMode))}
        >
          <FontAwesomeIcon
            className="me-2"
            icon={editMode ? faCheck : faPenToSquare}
          />
          {editMode ? "Done" : "Edit"}
        </Button>
      }
    >
      {editMode ? (
        <Stack gap={3}>
          <TextView
            id={`constants-${instanceId}`}
            name="constants"
            textViewType="constants"
            label="Individual constants"
            placeholder="Constants"
            lock={() => lockConstants()}
            selectLock={selectConstantsLock}
            disabledOverride={hasContext}
          />

          <TextView
            id={`predicates-${instanceId}`}
            name="predicates"
            textViewType="predicates"
            label="Predicate symbols"
            placeholder="Predicates"
            lock={() => lockPredicates()}
            selectLock={selectPredicatesLock}
            disabledOverride={hasContext}
          />

          <TextView
            id={`functions-${instanceId}`}
            name="functions"
            textViewType="functions"
            label="Function symbols"
            placeholder="Functions"
            lock={() => lockFunctions()}
            selectLock={selectFunctionsLock}
            disabledOverride={hasContext}
          />

          {symbolsClash && <div className="text-danger">{symbolsClash}</div>}
        </Stack>
      ) : (
        <ViewOnlyLanguageDisplay
          triggerEdit={() => dispatch(editModeChanged(true))}
        />
      )}
    </ComponentCard>
  );
}

interface ViewOnlyLanguageDisplayProps {
  triggerEdit: () => void;
}

function ViewOnlyLanguageDisplay({
  triggerEdit,
}: ViewOnlyLanguageDisplayProps) {
  const { value: constants } = useAppSelector((state) =>
    selectValidatedTextView(state, "constants"),
  );
  const { value: predicates } = useAppSelector((state) =>
    selectValidatedTextView(state, "predicates"),
  );
  const { value: functions } = useAppSelector((state) =>
    selectValidatedTextView(state, "functions"),
  );

  return (
    <Stack
      gap={3}
      className="ms-2 view-only-language"
      onDoubleClick={triggerEdit}
      style={{ fontSize: "0.875rem" }}
    >
      <div>
        <InlineMath>{"\\mathcal{C_L} = \\{"}</InlineMath>
        {constants && <span className="mx-1">{constants}</span>}
        <InlineMath>{"\\}"}</InlineMath>
      </div>

      <div>
        <InlineMath>{"\\mathcal{P_L} = \\{"}</InlineMath>
        {predicates && <span className="mx-1">{predicates}</span>}
        <InlineMath>{"\\}"}</InlineMath>
      </div>

      <div>
        <InlineMath>{"\\mathcal{F_L} = \\{"}</InlineMath>
        {functions && <span className="mx-1">{functions}</span>}
        <InlineMath>{"\\}"}</InlineMath>
      </div>
    </Stack>
  );
}

const help = (
  <>
    <p>A first-order language is defined in this section.</p>
    <p className="mb-0">Syntactic requirements:</p>
    <ul className="mb-0">
      <li>
        Symbols in all sets are <strong>comma-separated</strong>.
      </li>
      <li>
        Each predicate and function symbol must be followed by a slash (
        <code>/</code>) and arity (the number of arguments the symbol takes, a
        positive integer):{" "}
        <strong>
          <code>symbol/arity</code>
        </strong>
        .
      </li>
    </ul>
  </>
);
