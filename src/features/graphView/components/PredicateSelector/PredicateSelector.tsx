import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { predicateToggled, selectUnaryPreds } from "../../graphs/graphSlice";
import type { GraphType } from "../../graphs/plugins";

export default function PredicateSelector({
  id,
  type,
}: {
  id: string;
  type: GraphType;
}) {
  const dispatch = useAppDispatch();
  const unaryPreds = useAppSelector(selectUnaryPreds);
  const selectedPreds = useAppSelector(
    (state) => state.graphView[id]?.state[type].selectedPreds ?? [],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h6 style={{ whiteSpace: "nowrap" }}>Unary Predicates</h6>
      {unaryPreds.map(([pred]) => (
        <label
          key={pred}
          style={{ textAlign: "center" }}
          //onMouseEnter={() => dispatch(predFocused(p.name))}
          //onMouseLeave={() => dispatch(predUnfocused())}
        >
          <input
            type="checkbox"
            style={{ marginRight: "0.5rem" }}
            checked={selectedPreds.includes(pred)}
            onChange={() =>
              dispatch(predicateToggled({ id, type, predicate: pred }))
            }
          />
          {pred}
        </label>
      ))}
    </div>
  );
}
