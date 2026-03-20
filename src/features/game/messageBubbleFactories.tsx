import { InlineMath } from "react-katex";
import { latex } from "../../common/utils";
import type { BubbleFormat } from "./GameHistory";
import type { SignedFormula } from "../../model/formula/Formula";
import QuantifiedFormula from "../../model/formula/QuantifiedFormula";
import PredicateAtom from "../../model/formula/Formula.PredicateAtom";
import type Structure from "../../model/Structure";
import EqualityAtom from "../../model/formula/Formula.EqualityAtom";
import { BubbleList } from "./BubbleList";

export const getAssumptionBubble = (
  sFormula: SignedFormula,
  valuation: string,
) => {
  const { sign, formula } = sFormula;
  return {
    text: (
      <>
        Let's assume that{" "}
        <InlineMath>
          {latex().M().models(sign).formula(formula).valuation(valuation).get()}
        </InlineMath>
      </>
    ),
    sender: "game",
  } as BubbleFormat;
};

export const getAlphaBubbles = (
  sFormula: SignedFormula,
  valuation: string,
  isLast: boolean,
) => {
  const bubbles: BubbleFormat[] = [];
  const { sign, formula } = sFormula;
  const subFormulas = formula.getSignedSubFormulas(sign);

  if (subFormulas.length > 1) {
    bubbles.push({
      text: (
        <>
          <BubbleList
            title="Then simultaneously:"
            items={subFormulas.map((sf) =>
              latex()
                .M()
                .models(sf.sign)
                .formula(sf.formula)
                .valuation(valuation)
                .get(),
            )}
          />
          <p className="m-0 mt-1">I will choose a case that may not hold.</p>
        </>
      ),
      sender: "game",
    });
  } else if (subFormulas.length === 1) {
    const sf = subFormulas[0];

    bubbles.push({
      text: (
        <>
          Then{" "}
          <InlineMath>
            {latex()
              .M()
              .models(sf.sign)
              .formula(sf.formula)
              .valuation(valuation)
              .get()}
          </InlineMath>
        </>
      ),
      sender: "game",
    });
  }

  if (!isLast) {
    bubbles.push({ text: <>Continue</>, sender: "player" });
  }

  return bubbles;
};

export const getBetaBubbles = (
  sFormula: SignedFormula,
  valuation: string,
  isLast: boolean,
  bubbleIdx: number,
  choiceIdx?: number,
) => {
  const bubbles: BubbleFormat[] = [];
  const { sign, formula } = sFormula;
  const subFormulas = formula.getSignedSubFormulas(sign);

  bubbles.push({
    text: (
      <BubbleList
        title="Which option is true?"
        items={subFormulas.map((sf) =>
          latex()
            .M()
            .models(sf.sign)
            .formula(sf.formula)
            .valuation(valuation)
            .get(),
        )}
      />
    ),
    sender: "game",
  });

  if (!isLast && choiceIdx !== undefined) {
    const { sign: chSign, formula: chFormula } = subFormulas[choiceIdx];

    bubbles.push({
      text: (
        <InlineMath>
          {latex()
            .M()
            .models(chSign)
            .formula(chFormula)
            .valuation(valuation)
            .get()}
        </InlineMath>
      ),
      sender: "player",
      goBack: bubbleIdx,
    });
  }

  return bubbles;
};

export const getGammaBubbles = (
  sFormula: SignedFormula,
  valuation: Map<string, string>,
  isLast: boolean,
) => {
  const bubbles: BubbleFormat[] = [];
  const { sign, formula } = sFormula;

  if (!(formula instanceof QuantifiedFormula)) return bubbles;

  const { sign: subSign, formula: subFormula } =
    formula.getSignedSubFormulas(sign)[0];

  bubbles.push({
    text: (
      <>
        Then{" "}
        <InlineMath>
          {latex()
            .M()
            .models(subSign)
            .formula(subFormula)
            .valuation(
              latex().wildcardValuationPairs(valuation, formula.variableName),
            )
            .get()}
        </InlineMath>{" "}
        for any domain element <InlineMath>d</InlineMath>. Let me pick a
        possible counterexample.
      </>
    ),
    sender: "game",
  });

  if (!isLast) {
    bubbles.push({ text: <>Continue</>, sender: "player" });
  }

  return bubbles;
};

export const getDeltaBubbles = (
  sFormula: SignedFormula,
  valuation: Map<string, string>,
  isLast: boolean,
  bubbleIdx: number,
  element: string,
) => {
  const bubbles: BubbleFormat[] = [];
  const { sign, formula } = sFormula;

  if (!(formula instanceof QuantifiedFormula)) return bubbles;

  const { sign: subSign, formula: subFormula } =
    formula.getSignedSubFormulas(sign)[0];

  bubbles.push({
    text: (
      <>
        Which domain element <InlineMath>d</InlineMath> should we assign to{" "}
        <InlineMath>{formula.variableName}</InlineMath> so that{" "}
        <InlineMath>
          {latex()
            .M()
            .models(subSign)
            .formula(subFormula)
            .valuation(
              latex().wildcardValuationPairs(valuation, formula.variableName),
            )
            .get()}
        </InlineMath>
        ?
      </>
    ),
    sender: "game",
  });

  if (!isLast) {
    bubbles.push({
      text: (
        <>
          Assign <InlineMath>{latex().text(element).get()}</InlineMath> to{" "}
          <InlineMath>{formula.variableName}</InlineMath>
        </>
      ),
      sender: "player",
      goBack: bubbleIdx,
    });
  }

  return bubbles;
};

export const getGameResultBubble = (
  sFormula: SignedFormula,
  explanation: JSX.Element,
  won: boolean,
  originalFormula: SignedFormula,
  originallyCorrect: boolean,
) => {
  const bubbles: BubbleFormat[] = [];
  const { sign, formula } = sFormula;

  const couldHaveWon = originallyCorrect && !won;

  bubbles.push({
    text: (
      <>
        <strong>{won ? "You win" : "You lose"}</strong>, because{" "}
        <InlineMath>
          {latex()
            .M()
            .models(sign === won)
            .formula(formula)
            .get()}
        </InlineMath>
        {explanation}
      </>
    ),
    sender: "game",
    win: won,
    lose: !won,
    fixableLoss: couldHaveWon || undefined,
  });

  bubbles.push({
    text: (
      <>
        {couldHaveWon && (
          <>
            <strong>You could have won, though.</strong>
          </>
        )}
        Your initial assumption that{" "}
        <InlineMath>
          {latex()
            .M()
            .models(originalFormula.sign)
            .formula(originalFormula.formula)
            .valuation()
            .get()}
        </InlineMath>{" "}
        was
        {originallyCorrect ? " correct." : " incorrect."}{" "}
        {couldHaveWon && (
          <>
            Find incorrect intermediate answers and correct them! You can use
            the <strong>Change</strong> link next to your answers for that.
          </>
        )}
      </>
    ),
    sender: "game",
  });

  return bubbles;
};

export const generateExplanation = (
  sFormula: SignedFormula,
  won: boolean,
  structure: Structure,
  valuation: Map<string, string>,
  valuationText: string,
) => {
  const { sign, formula } = sFormula;

  let explanationBody = "";
  if (formula instanceof PredicateAtom) {
    const termNames = formula.terms
      .map((t) =>
        latex().raw(t.toTex()).sup(latex().M().get()).altValuation().get(),
      )
      .join(", ");

    const termValues = latex()
      .text(formula.terms.map((t) => t.eval(structure, valuation)).join(", "))
      .get();

    const interpretation = latex().text(formula.name).get();

    const connective = sign === won ? "\\in" : "\\not\\in";

    const equality =
      formula.terms.length > 1
        ? `(${termNames}) = (${termValues})`
        : `${termNames} = ${termValues}`;

    explanationBody = `${equality} ${connective} i(${interpretation})`;
  }

  if (formula instanceof EqualityAtom) {
    const leftTerm = latex()
      .raw(formula.subLeft.toTex())
      .sup(latex().M().get())
      .altValuation()
      .get();
    const leftValue = latex()
      .text(formula.subLeft.eval(structure, valuation))
      .get();

    const rightTerm = latex()
      .raw(formula.subRight.toTex())
      .sup(latex().M().get())
      .altValuation()
      .get();
    const rightValue = latex()
      .text(formula.subRight.eval(structure, valuation))
      .get();

    const connective = sign === won ? "=" : "\\neq";

    explanationBody = `${leftTerm} = ${leftValue} ${connective} ${rightValue} = ${rightTerm}`;
  }

  return (
    <>
      <InlineMath>{"\\;[e']"}</InlineMath>, since{" "}
      <InlineMath>{explanationBody}</InlineMath> where{" "}
      <InlineMath>{`e' = ${latex().rawValuation(valuationText).get()}`}</InlineMath>
    </>
  );
};
