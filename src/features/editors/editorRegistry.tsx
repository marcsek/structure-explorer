import IntervalView from "../caseTreeView/IntervalView";
import DatabaseView from "../databaseView/DatabaseView";
import {
  drawerEditorAdapter,
  type DrawerEditorComponent,
} from "../drawerEditor/drawerEditorAdapter";
import GraphView from "../graphView/components/GraphView/GraphView";
import type { GraphType } from "../graphView/graphs/plugins";
import MatrixView from "../matrixView/MatrixView";
import type { TupleInfo } from "../structure/tupleInfo";
import { textEditorAdapter } from "../textView/textEditorAdapter";
import type { EditorDescriptor } from "./editorDescriptor";
import type { EditorType } from "./editorTypes";

const graphEditorAdapter =
  (type: GraphType): DrawerEditorComponent =>
  (props) => <GraphView {...props} graphType={type} />;

const correctedArity = ({ type, arity }: TupleInfo) =>
  type === "function" ? arity + 1 : arity;

const isBinaryRelation = (tuple: TupleInfo) => correctedArity(tuple) === 2;

export const editorDescriptors: Record<EditorType, EditorDescriptor> = {
  text: textEditorAdapter({
    type: "text",
    displayName: "Text Editor",
    buttonText: "Text (default)",
    isAvailable: () => true,
  }),
  caseTree: drawerEditorAdapter({
    type: "caseTree",
    displayName: "Case Tree Editor",
    buttonText: "Case Tree",
    isAvailable: ({ type }) => type === "function",
    supportsFullscreen: false,
    toolbar: false,
    component: IntervalView,
  }),
  matrix: drawerEditorAdapter({
    type: "matrix",
    displayName: "Matrix Editor",
    buttonText: "Matrix",
    group: "tables",
    isAvailable: ({ arity }) => arity <= 2,
    supportsFullscreen: false,
    toolbar: {},
    component: MatrixView,
  }),
  database: drawerEditorAdapter({
    type: "database",
    displayName: "Database Table Editor",
    buttonText: "Database",
    group: "tables",
    isAvailable: ({ type, arity }) => arity <= 2 || type !== "function",
    supportsFullscreen: false,
    toolbar: { disabledFilters: ["domainSelector", "unaryFilterToggle"] },
    component: DatabaseView,
  }),
  oriented: drawerEditorAdapter({
    type: "oriented",
    displayName: "Oriented Graph",
    buttonText: "Oriented",
    group: "graphs",
    isAvailable: isBinaryRelation,
    supportsFullscreen: true,
    toolbar: {},
    component: graphEditorAdapter("oriented"),
  }),
  hasse: drawerEditorAdapter({
    type: "hasse",
    displayName: "Hasse Diagram",
    buttonText: "Hasse",
    group: "graphs",
    isAvailable: (tuple) =>
      isBinaryRelation(tuple) && tuple.type !== "function",
    supportsFullscreen: true,
    toolbar: {},
    component: graphEditorAdapter("hasse"),
  }),
  bipartite: drawerEditorAdapter({
    type: "bipartite",
    displayName: "Bipartite Graph",
    buttonText: "Bipartite",
    group: "graphs",
    isAvailable: isBinaryRelation,
    supportsFullscreen: true,
    toolbar: {},
    component: graphEditorAdapter("bipartite"),
  }),
};
