import { selectParsedDomain } from "../../../structure/structureSlice";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { selectedNodesChanged } from "../../graphs/graphSlice";
import type { GraphType } from "../../graphs/plugins";

export default function NodeSelector({
  id,
  type,
}: {
  id: string;
  type: GraphType;
}) {
  const dispatch = useAppDispatch();
  const domain = useAppSelector(selectParsedDomain)?.parsed ?? [];
  const selectedNodes = useAppSelector(
    (state) => state.graphView[id]?.[type].selectedNodes,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <h6 style={{ whiteSpace: "nowrap" }}>Domain Elements</h6>
      {domain.map((element) => (
        <label key={element} style={{ textAlign: "center" }}>
          <input
            type="checkbox"
            checked={selectedNodes.includes(element)}
            style={{ marginRight: "0.5rem" }}
            onChange={() =>
              dispatch(
                selectedNodesChanged({
                  id,
                  type,
                  toggledNode: element,
                }),
              )
            }
          />
          {element}
        </label>
      ))}
    </div>
  );
}
