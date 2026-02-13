import { Button, Stack } from "react-bootstrap";
import InputGroupTitle from "../../components_helper/InputGroupTitle";
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
import ComponentCard from "../../components_helper/ComponentCard/ComponentCard.tsx";
import {
  selectValidatedTextView,
  updateTextView,
} from "../textView/textViewSlice.ts";
import { useSyncLanguageContext } from "../../logicContext.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPenToSquare } from "@fortawesome/free-solid-svg-icons";

export default function LanguageComponent() {
  const dispatch = useAppDispatch();

  const constantsTextView = useAppSelector((state) =>
    selectValidatedTextView(state, "constants"),
  );
  const predicatesTextView = useAppSelector((state) =>
    selectValidatedTextView(state, "predicates"),
  );
  const functionsTextView = useAppSelector((state) =>
    selectValidatedTextView(state, "functions"),
  );

  const constantsLock = useAppSelector(selectConstantsLock);
  const predicatesLock = useAppSelector(selectPredicatesLock);
  const functionsLock = useAppSelector(selectFunctionsLock);

  const symbolsClash = useAppSelector(selectSymbolsClash);
  const { hasContext } = useSyncLanguageContext();
  const editMode = useAppSelector((state) => state.present.language.editMode);

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
          <InputGroupTitle
            label={"Individual constants"}
            id="constants"
            prefix={<InlineMath>{String.raw`\mathcal{C_L} = \{`}</InlineMath>}
            suffix={<InlineMath>{String.raw`\}`}</InlineMath>}
            placeholder="Constants"
            text={constantsTextView.value}
            onChange={(e) => {
              dispatch(
                updateTextView({ type: "constants", value: e.target.value }),
              );
            }}
            error={constantsTextView.error}
            lockChecker={constantsLock}
            locker={() => dispatch(lockConstants())}
            disabledOverride={hasContext}
          />

          <InputGroupTitle
            label={"Predicate symbols"}
            id="predicates"
            prefix={
              <InlineMath>{String.raw`\mathcal{P}_{\mathcal{L}} = \{`}</InlineMath>
            }
            suffix={<InlineMath>{String.raw`\}`}</InlineMath>}
            placeholder="Predicates"
            text={predicatesTextView.value}
            onChange={(e) => {
              dispatch(
                updateTextView({ type: "predicates", value: e.target.value }),
              );
            }}
            error={predicatesTextView.error}
            lockChecker={predicatesLock}
            locker={() => dispatch(lockPredicates())}
            disabledOverride={hasContext}
          />

          <InputGroupTitle
            label={"Function symbols"}
            id="functions"
            prefix={
              <InlineMath>{String.raw`\mathcal{F}_{\mathcal{L}} = \{`}</InlineMath>
            }
            suffix={<InlineMath>{String.raw`\}`}</InlineMath>}
            placeholder="Functions"
            text={functionsTextView.value}
            onChange={(e) => {
              dispatch(
                updateTextView({ type: "functions", value: e.target.value }),
              );
            }}
            error={functionsTextView.error}
            lockChecker={functionsLock}
            locker={() => dispatch(lockFunctions())}
            disabledOverride={hasContext}
          />

          {symbolsClash && <div className="text-danger">{symbolsClash}</div>}
        </Stack>
      ) : (
        <ViewOnlyLanguageDisplay
          constants={constantsTextView.value}
          predicates={predicatesTextView.value}
          functions={functionsTextView.value}
          triggerEdit={() => dispatch(editModeChanged(true))}
        />
      )}
    </ComponentCard>
  );
}

interface ViewOnlyLanguageDisplayProps {
  constants: string;
  predicates: string;
  functions: string;
  triggerEdit: () => void;
}

function ViewOnlyLanguageDisplay(props: ViewOnlyLanguageDisplayProps) {
  return (
    <Stack
      gap={3}
      className="ms-2 view-only-language"
      onDoubleClick={props.triggerEdit}
      style={{ fontSize: "0.875rem" }}
    >
      <div>
        <InlineMath>{"\\mathcal{C_L} = \\{"}</InlineMath>
        {props.constants && <span className="mx-1">{props.constants}</span>}
        <InlineMath>{"\\}"}</InlineMath>
      </div>

      <div>
        <InlineMath>{"\\mathcal{P_L} = \\{"}</InlineMath>
        {props.predicates && <span className="mx-1">{props.predicates}</span>}
        <InlineMath>{"\\}"}</InlineMath>
      </div>

      <div>
        <InlineMath>{"\\mathcal{F_L} = \\{"}</InlineMath>
        {props.functions && <span className="mx-1">{props.functions}</span>}
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
