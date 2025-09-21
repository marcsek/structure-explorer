import type { GraphType } from "../../graphs/plugins";
import NodeSelector from "../NodeSelector/NodeSelector";
import PredicateSelector from "../PredicateSelector/PredicateSelector";

export default function GraphHUD({
  id,
  type,
  typeSelected,
}: {
  id: string;
  type: GraphType;
  typeSelected: (type: GraphType) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
      }}
    >
      <em>{`ID: ${type}-${id}`}</em>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h6>Graph Types</h6>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.2rem",
          }}
        >
          <button onClick={() => typeSelected("oriented")}>Oriented</button>
          <button onClick={() => typeSelected("hasse")}>Hasse</button>
          <button
            style={{ margin: "0 auto" }}
            onClick={() => typeSelected("bipartite")}
          >
            Bipartite
          </button>
        </div>
      </div>
      <PredicateSelector id={id} type={type} />
      <NodeSelector id={id} type={type} />
    </div>
  );
}
