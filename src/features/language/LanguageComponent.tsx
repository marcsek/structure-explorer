import { Stack } from "react-bootstrap";
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
} from "./languageSlice";
import ComponentCard from "../../components_helper/ComponentCard/ComponentCard.tsx";
import {
  selectValidatedTextView,
  updateTextView,
} from "../textView/textViewSlice.ts";
import { useSyncLanguageContext } from "../../logicContext.ts";

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

  return (
    <ComponentCard
      heading={
        <span>
          Language <InlineMath>{String.raw`\mathcal{L}`}</InlineMath>
        </span>
      }
      help={help}
    >
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
    </ComponentCard>
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
