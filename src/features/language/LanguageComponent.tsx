import { Stack } from "react-bootstrap";
import InputGroupTitle from "../../components_helper/InputGroupTitle";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { InlineMath } from "react-katex";
import {
  selectConstantsText,
  selectParsedConstants,
  selectParsedFunctions,
  selectParsedPredicates,
  selectFunctionsText,
  selectPredicatesText,
  updateConstants,
  updateFunctions,
  selectSymbolsClash,
  selectConstantsLock,
  selectPredicatesLock,
  selectFunctionsLock,
  lockPredicates,
  lockConstants,
  lockFunctions,
  updatePredicates,
} from "./languageSlice";
import ComponentCard from "../../components_helper/ComponentCard";

export default function LanguageComponent() {
  const dispatch = useAppDispatch();
  const constantsText = useAppSelector(selectConstantsText);
  const constantsLock = useAppSelector(selectConstantsLock);
  const predicatesText = useAppSelector(selectPredicatesText);
  const predicatesLock = useAppSelector(selectPredicatesLock);
  const functionsText = useAppSelector(selectFunctionsText);
  const functionsLock = useAppSelector(selectFunctionsLock);
  const constantsErorrs = useAppSelector(selectParsedConstants);
  const predicatesErorrs = useAppSelector(selectParsedPredicates);
  const functionsErrors = useAppSelector(selectParsedFunctions);
  const symbolsClash = useAppSelector(selectSymbolsClash);

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
          text={constantsText}
          onChange={(e) => {
            dispatch(updateConstants(e.target.value));
          }}
          error={constantsErorrs.error}
          lockChecker={constantsLock}
          locker={() => dispatch(lockConstants())}
        />

        <InputGroupTitle
          label={"Predicate symbols"}
          id="predicates"
          prefix={
            <InlineMath>{String.raw`\mathcal{P}_{\mathcal{L}} = \{`}</InlineMath>
          }
          suffix={<InlineMath>{String.raw`\}`}</InlineMath>}
          placeholder="Predicates"
          text={predicatesText}
          onChange={(e) => {
            dispatch(updatePredicates(e.target.value));
          }}
          error={predicatesErorrs.error}
          lockChecker={predicatesLock}
          locker={() => dispatch(lockPredicates())}
        />

        <InputGroupTitle
          label={"Function symbols"}
          id="functions"
          prefix={
            <InlineMath>{String.raw`\mathcal{F}_{\mathcal{L}} = \{`}</InlineMath>
          }
          suffix={<InlineMath>{String.raw`\}`}</InlineMath>}
          placeholder="Functions"
          text={functionsText}
          onChange={(e) => {
            dispatch(updateFunctions(e.target.value));
          }}
          error={functionsErrors.error}
          lockChecker={functionsLock}
          locker={() => dispatch(lockFunctions())}
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
