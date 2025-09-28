import { bipartiteGraphPlugin } from "./features/graphView/graphs/BipartiteGraph/plugin";
import type { GraphManagerState } from "./features/graphView/graphs/graphSlice";
import { hasseDiagramPlugin } from "./features/graphView/graphs/HasseDiagram/plugin";
import { orientedGraphPlugin } from "./features/graphView/graphs/OrientedGraph/plugin";
import type { LanguageState } from "./features/language/languageSlice";
import type { StructureState } from "./features/structure/structureSlice";

export const langPreset: LanguageState = {
  constants: "Alice, Bob, Jack, Karen, Mark",
  predicates: "teaches/2, Student/1, Teacher/1, Janitor/1",
  functions: "",
};

export const structPreset: StructureState = {
  domain: "A, B, C, D, E",
  iC: {
    Bob: { text: "A" },
    Alice: { text: "B" },
    Jack: { text: "C" },
    Karen: { text: "E" },
    Mark: { text: "D" },
  },
  iP: {
    teaches: { text: "" },
    Student: { text: "A, C" },
    Teacher: { text: "A, B, C" },
    Janitor: { text: "A, B, C, D" },
  },
  iF: {},
  parsedDomain: ["A", "B", "C", "D", "E"],
};

export const graphPreset: GraphManagerState = {
  teaches: {
    bipartite: bipartiteGraphPlugin.init(["A", "B", "C", "D", "E"], {
      name: "teaches",
      intr: [],
    }),
    hasse: hasseDiagramPlugin.init(["A", "B", "C", "D", "E"], {
      name: "teaches",
      intr: [],
    }),
    oriented: orientedGraphPlugin.init(["A", "B", "C", "D", "E"], {
      name: "teaches",
      intr: [],
    }),
  },
};
