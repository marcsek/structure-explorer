import {
  type BubbleFormat,
  gameGoBack,
  selectFormulaChoices,
  selectHistoryData,
} from "../formulas/formulasSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectStructure } from "../structure/structureSlice";
import PredicateAtom from "../../model/formula/Formula.PredicateAtom";
import QuantifiedFormula from "../../model/formula/QuantifiedFormula";
import MessageBubble from "../../components_helper/MessageBubble";
import { useEffect, useRef } from "react";
import { selectValuation } from "../variables/variablesSlice";
import EqualityAtom from "../../model/formula/Formula.EqualityAtom";
import { InlineMath } from "react-katex";
import { Stack } from "react-bootstrap";

interface Props {
  id: number;
}

export function getDiffAndNew(
  a: Map<string, string>,
  b: Map<string, string>,
): Map<string, string> {
  return new Map(
    Array.from(b.entries()).filter(
      ([key, value]) => !a.has(key) || a.get(key) !== value,
    ),
  );
}

const M = () => "\\mathcal{M}";
const models = (m: boolean) => (m ? "\\models" : "\\not\\models");
const evalVars = (vars?: string) => `[e${vars ?? ""}]`;
const escape = (toEscape: string) => toEscape.replace(/_/g, "\\_");

export default function GameHistory({ id }: Props) {
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => selectHistoryData(state, id));
  const structure = useAppSelector(selectStructure);
  const choices = useAppSelector((state) => selectFormulaChoices(state, id));
  const last = useRef<HTMLDivElement>(null);
  const initialValuation = useAppSelector(selectValuation);

  useEffect(() => {
    if (last.current) {
      last.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [data]);

  const bubbles: BubbleFormat[] = [];
  let back = 0;

  for (const { sf, valuation, type, winFormula, winElement } of data) {
    const valuationDiff = getDiffAndNew(initialValuation, valuation);

    const valuationText = Array.from(valuationDiff)
      .map(([from, to]) => `(${from} / \\text{${escape(to)}})`)
      .join(" ");

    bubbles.push({
      text: (
        <>
          You assume that{" "}
          <InlineMath>
            {`${M()} ${models(sf?.sign)} ${sf.formula.toTex()}${evalVars(valuationText)}`}
          </InlineMath>
        </>
      ),
      sender: "game",
    });

    const last = sf.formula.getSubFormulas().length === 0;

    if (
      (last && sf.formula instanceof PredicateAtom) ||
      sf.formula instanceof EqualityAtom
    ) {
      const satisfied = sf.formula.eval(structure, valuation) === sf.sign;

      const explanaiton =
        sf.formula instanceof PredicateAtom ? (
          <>
            , since{" "}
            <InlineMath>
              {`(\\text{${escape(
                sf.formula.terms
                  .map((t) => t.eval(structure, valuation))
                  .join(","),
              )}}) ${sf.sign === satisfied ? "\\in" : "\\not\\in"} i(\\text{${escape(sf.formula.name)}})`}
            </InlineMath>
          </>
        ) : (
          <>
            , since{" "}
            <InlineMath>
              {`\\text{${escape(sf.formula.subLeft.eval(structure, valuation))}} ${sf.sign === satisfied ? "=" : "\\neq"} \\text{${escape(sf.formula.subRight.eval(structure, valuation))}}`}
            </InlineMath>
          </>
        );
      bubbles.push({
        text: (
          <>
            <strong>{satisfied ? "You win " : "You lose"}</strong>,{" "}
            <InlineMath>{`${M()} ${models(sf.sign === satisfied)} ${sf.formula.toTex()}${evalVars(valuationText)}`}</InlineMath>
            {explanaiton}
          </>
        ),
        sender: "game",
        win: satisfied,
        lose: !satisfied,
      });

      const originalGuess =
        data[0].sf.formula.eval(structure, valuation) === data[0].sf.sign;
      bubbles.push({
        text: (
          <>
            {originalGuess === true && satisfied === false && (
              <>
                <strong>You could have won, though.</strong>
              </>
            )}
            Your initial assumption that{" "}
            <InlineMath>
              {`${M()} ${models(data[0].sf.sign)} ${data[0].sf.formula.toTex()} ${evalVars()}`}
            </InlineMath>{" "}
            was
            {originalGuess ? " correct." : " incorrect."}{" "}
            {originalGuess === true && satisfied === false && (
              <>
                Find incorrect intermediate answers and correct them! You can
                use <strong>change button</strong> next to your answers for
                that.
              </>
            )}
          </>
        ),
        sender: "game",
      });

      break;
    }

    if (type === "alpha" && winFormula) {
      bubbles.push({
        text: (
          <>
            Then{" "}
            <InlineMath>
              {`${M()} ${models(winFormula.sign)} ${winFormula.formula.toTex()} ${evalVars(valuationText)}`}
            </InlineMath>
          </>
        ),
        sender: "game",
      });

      if (back < choices.length) {
        bubbles.push({
          text: <>Continue</>,
          sender: "player",
        });
      }
    }

    if (type === "beta") {
      const subfs = sf.formula.getSignedSubFormulas(sf.sign);

      bubbles.push({
        text: <>Which option is true?</>,
        sender: "game",
      });

      subfs.forEach((s) =>
        bubbles.push({
          text: (
            <InlineMath>{`${M()} ${models(s.sign)} ${s.formula.toTex()}${evalVars(valuationText)}`}</InlineMath>
          ),
          sender: "game",
        }),
      );

      if (back < choices.length) {
        const choice = subfs[choices[back].formula!];
        bubbles.push({
          text: (
            <InlineMath>
              {`${M()} ${models(choice.sign)} ${choice.formula.toTex()}${evalVars(valuationText)}`}
            </InlineMath>
          ),
          sender: "player",
          goBack: back,
        });
      }
    }

    if (type === "gamma" && sf.formula instanceof QuantifiedFormula) {
      bubbles.push({
        text: (
          <>
            Then{" "}
            <InlineMath>
              {`${M()} ${models(sf.sign)} ${sf.formula.toTex()}${evalVars(valuationText)}`}
            </InlineMath>{" "}
            also when we assign element{" "}
            <InlineMath>{`\\text{${escape(winElement ?? "")}}`}</InlineMath> to{" "}
            <InlineMath>{sf.formula.variableName}</InlineMath>
          </>
        ),
        sender: "game",
      });

      if (back < choices.length) {
        bubbles.push({
          text: <>Continue</>,
          sender: "player",
        });
      }
    }

    if (type === "delta" && sf.formula instanceof QuantifiedFormula) {
      bubbles.push({
        text: (
          <>
            Which domain element should we assign to{" "}
            <InlineMath>{sf.formula.variableName}</InlineMath> to show that{" "}
            <InlineMath>
              {`${M()} ${models(sf.sign)} ${sf.formula.toTex()} ${evalVars(valuationText)}`}
            </InlineMath>
          </>
        ),
        sender: "game",
      });

      if (back < choices.length) {
        bubbles.push({
          text: (
            <>
              Assign{" "}
              <InlineMath>{`\\text{${escape(choices[back].element ?? "")}}`}</InlineMath>{" "}
              to <InlineMath>{sf.formula.variableName}</InlineMath>
            </>
          ),
          sender: "player",
          goBack: back,
        });
      }
    }

    back++;
  }

  return (
    <Stack gap={1}>
      {bubbles.map(({ text, sender, goBack, win, lose }, index) => (
        <MessageBubble
          key={`${index}-${sender}`}
          children={text}
          sent={sender === "player"}
          recieved={sender === "game"}
          onClick={
            goBack !== undefined
              ? () => dispatch(gameGoBack({ id: id, index: goBack }))
              : undefined
          }
          change={goBack !== undefined}
          lose={lose}
          win={win}
        />
      ))}
      <div ref={last}></div>
    </Stack>
  );
}
