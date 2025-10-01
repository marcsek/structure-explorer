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

interface Props {
  id: number;
}

export function getDiffAndNew(
  a: Map<string, string>,
  b: Map<string, string>
): Map<string, string> {
  return new Map(
    Array.from(b.entries()).filter(
      ([key, value]) => !a.has(key) || a.get(key) !== value
    )
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

  let bubbles: BubbleFormat[] = [];
  let back = 0;

  for (const { sf, valuation, type, winFormula, winElement } of data) {
    const valuationDiff = getDiffAndNew(initialValuation, valuation);

    let valuationText = Array.from(valuationDiff)
      .map(([from, to]) => `(${from} / ${to})`)
      .join(" ");

    bubbles.push({
      text: (
        <>
          You assume that ℳ {sf?.sign ? " ⊨ " : " ⊭ "}{" "}
          <InlineMath>{sf.formula.toTex()}</InlineMath>[<var> e</var>
          {valuationText} ]
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
            , since (
            {sf.formula.terms
              .map((t) => t.eval(structure, valuation))
              .join(",")}
            ){sf.sign === satisfied ? " ∈ " : " ∉ "}
            i({sf.formula.name})
          </>
        ) : (
          <>
            , since {sf.formula.subLeft.eval(structure, valuation)}
            {sf.sign === satisfied ? " = " : " ≠ "}
            {sf.formula.subRight.eval(structure, valuation)}
          </>
        );
      bubbles.push({
        text: (
          <>
            <strong>{satisfied ? "You win " : "You lose"}</strong>, ℳ
            {sf.sign === satisfied ? " ⊨ " : " ⊭ "}
            <InlineMath>{sf.formula.toTex()}</InlineMath>[<var> e</var>{" "}
            {valuationText}]{explanaiton}
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
            Your initial assumption that ℳ {data[0].sf.sign ? "⊨" : "⊭"}
            <InlineMath>{data[0].sf.formula.toTex()}</InlineMath>[<var> e</var>{" "}
            ] was
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
            Then ℳ {winFormula.sign ? "⊨" : "⊭"}{" "}
            <InlineMath>{winFormula.formula.toTex()}</InlineMath>[<var> e</var>
            {valuationText} ]
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

      subfs.forEach((s, _i) =>
        bubbles.push({
          text: (
            <>
              ℳ {s.sign ? "⊨" : "⊭"}{" "}
              <InlineMath>{s.formula.toTex()}</InlineMath>[<var> e</var>
              {valuationText} ]
            </>
          ),
          sender: "game",
        })
      );

      if (back < choices.length) {
        const choice = subfs[choices[back].formula!];
        bubbles.push({
          text: (
            <>
              ℳ {choice.sign ? "⊨" : "⊭"}{" "}
              <InlineMath>{choice.formula.toTex()}</InlineMath>[<var> e</var>
              {valuationText} ]
            </>
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
            Then ℳ {sf.sign ? " ⊨ " : " ⊭ "}{" "}
            <InlineMath>{sf.formula.toTex()}</InlineMath>[<var> e</var>{" "}
            {valuationText} ] also when we assign element {winElement} to{" "}
            {sf.formula.variableName}
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
            <var>{sf.formula.variableName}</var> to show that ℳ
            {sf.sign ? " ⊨ " : " ⊭ "}{" "}
            <InlineMath>{sf.formula.toTex()}</InlineMath>[<var> e</var>
            {valuationText} ]
          </>
        ),
        sender: "game",
      });

      if (back < choices.length) {
        bubbles.push({
          text: (
            <>
              Assign {choices[back].element} to {sf.formula.variableName}
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
    <>
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
    </>
  );
}
