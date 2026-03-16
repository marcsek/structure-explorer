import {
  gameGoBack,
  selectFormulaChoices,
  selectHistoryData,
} from "../formulas/formulasSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectStructure } from "../structure/structureSlice";
import PredicateAtom from "../../model/formula/Formula.PredicateAtom";
import QuantifiedFormula from "../../model/formula/QuantifiedFormula";
import MessageBubble from "../../components_helper/MessageBubble";
import { useEffect, useRef, type ReactNode } from "react";
import { selectValuation } from "../variables/variablesSlice";
import EqualityAtom from "../../model/formula/Formula.EqualityAtom";
import { InlineMath } from "react-katex";
import { Stack } from "react-bootstrap";
import { latex } from "../../common/utils";

export type BubbleFormat = {
  text: ReactNode;
  sender: "game" | "player";
  goBack?: number;
  win?: boolean;
  lose?: boolean;
  fixableLoss?: boolean;
};

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
      .map(([from, to]) => `(${from} / ${latex().text(to).get()})`)
      .join(" ");

    bubbles.push({
      text: (
        <>
          You assume that{" "}
          <InlineMath>
            {latex()
              .M()
              .models(sf.sign)
              .formula(sf.formula)
              .valuation(valuationText)
              .get()}
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

      const explanation =
        sf.formula instanceof PredicateAtom ? (
          <>
            <InlineMath>{"[e']"}</InlineMath>, since{" "}
            <InlineMath>
              {`(${sf.formula.terms.map((t) => latex().raw(t.toTex()).sup(latex().M().get()).altValuation().get()).join(", ")}) = (${latex()
                .text(
                  sf.formula.terms
                    .map((t) => t.eval(structure, valuation))
                    .join(","),
                )
                .get()}) ${sf.sign === satisfied ? "\\in" : "\\not\\in"} i(${latex().text(sf.formula.name).get()})`}
            </InlineMath>{" "}
            where{" "}
            <InlineMath>{`e' = ${latex().rawValuation(valuationText).get()}`}</InlineMath>
          </>
        ) : (
          <>
            <InlineMath>{"[e']"}</InlineMath>, since{" "}
            <InlineMath>
              {`${latex().raw(sf.formula.subLeft.toTex()).sup(latex().M().get()).altValuation().get()} = ${latex().text(sf.formula.subLeft.eval(structure, valuation)).get()} ${sf.sign === satisfied ? "=" : "\\neq"} ${latex().text(sf.formula.subRight.eval(structure, valuation)).get()} = ${latex().raw(sf.formula.subRight.toTex()).sup(latex().M().get()).altValuation().get()}`}
            </InlineMath>{" "}
            where{" "}
            <InlineMath>{`e' = ${latex().rawValuation(valuationText).get()}`}</InlineMath>
          </>
        );

      const originalGuess =
        data[0].sf.formula.eval(structure, valuation) === data[0].sf.sign;

      bubbles.push({
        text: (
          <>
            <strong>{satisfied ? "You win" : "You lose"}</strong>, because{" "}
            <InlineMath>
              {latex()
                .M()
                .models(sf.sign === satisfied)
                .formula(sf.formula)
                .get()}
            </InlineMath>
            {explanation}
          </>
        ),
        sender: "game",
        win: satisfied,
        lose: !satisfied,
        fixableLoss: originalGuess && !satisfied ? true : undefined,
      });

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
              {latex()
                .M()
                .models(data[0].sf.sign)
                .formula(data[0].sf.formula)
                .valuation()
                .get()}
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
              {latex()
                .M()
                .models(winFormula.sign)
                .formula(winFormula.formula)
                .valuation(valuationText)
                .get()}
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
            <InlineMath>
              {latex()
                .M()
                .models(s.sign)
                .formula(s.formula)
                .valuation(valuationText)
                .get()}
            </InlineMath>
          ),
          sender: "game",
        }),
      );

      if (back < choices.length) {
        const choice = subfs[choices[back].formula!];
        bubbles.push({
          text: (
            <InlineMath>
              {latex()
                .M()
                .models(choice.sign)
                .formula(choice.formula)
                .valuation(valuationText)
                .get()}
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
              {latex()
                .M()
                .models(sf.sign)
                .formula(sf.formula)
                .valuation(valuationText)
                .get()}
            </InlineMath>{" "}
            also when we assign element{" "}
            <InlineMath>
              {latex()
                .text(winElement ?? "")
                .get()}
            </InlineMath>{" "}
            to <InlineMath>{sf.formula.variableName}</InlineMath>
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
              {latex()
                .M()
                .models(sf.sign)
                .formula(sf.formula)
                .valuation(valuationText)
                .get()}
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
              <InlineMath>
                {latex()
                  .text(choices[back].element ?? "")
                  .get()}
              </InlineMath>{" "}
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
      {bubbles.map(
        ({ text, sender, goBack, win, lose, fixableLoss }, index) => (
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
            fixableLoss={fixableLoss}
          />
        ),
      )}
      <div ref={last}></div>
    </Stack>
  );
}
