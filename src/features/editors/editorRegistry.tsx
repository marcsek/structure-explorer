import IntervalView from "../caseTreeView/IntervalView";
import DatabaseView from "../databaseView/DatabaseView";
import type { EditorFilters } from "../editorToolbar/components/EditorToolbar";
import GraphView from "../graphView/components/GraphView/GraphView";
import type { GraphType } from "../graphView/graphs/plugins";
import MatrixView from "../matrixView/MatrixView";
import type { TupleInfo } from "../structure/tupleInfo";
import TextView from "../textView/TextViewEditor";
import type {
  DrawerEditorComponent,
  StandaloneEditorComponent,
} from "./editorSurface";
import type { DrawerEditorType, EditorType } from "./editorTypes";

export type EditorGroup = "tables" | "graphs";

interface BaseEditorDescriptor {
  type: EditorType;
  displayName: string;
  buttonText: string;
  group?: EditorGroup;
  isAvailable: (tuple: TupleInfo) => boolean;
}

export interface DrawerEditorDescriptor extends BaseEditorDescriptor {
  surface: "drawer";
  type: DrawerEditorType;
  supportsFullscreen: boolean;
  toolbar: false | { disabledFilters?: EditorFilters[] };
  component: DrawerEditorComponent;
}

export interface StandaloneEditorDescriptor extends BaseEditorDescriptor {
  surface: "standalone";
  component: StandaloneEditorComponent;
}

export type EditorDescriptor =
  | DrawerEditorDescriptor
  | StandaloneEditorDescriptor;

const correctedArity = ({ type, arity }: TupleInfo) =>
  type === "function" ? arity + 1 : arity;

const isBinaryRelation = (tuple: TupleInfo) => correctedArity(tuple) === 2;

const graphEditorAdapter =
  (type: GraphType): DrawerEditorComponent =>
  (props) => <GraphView {...props} graphType={type} />;

export const editorDescriptors: Record<EditorType, EditorDescriptor> = {
  text: {
    type: "text",
    surface: "standalone",
    displayName: "Text Editor",
    buttonText: "Text (default)",
    isAvailable: () => true,
    component: TextView,
  },
  caseTree: {
    type: "caseTree",
    surface: "drawer",
    displayName: "Case Tree Editor",
    buttonText: "Case Tree",
    isAvailable: ({ type }) => type === "function",
    supportsFullscreen: false,
    toolbar: false,
    component: IntervalView,
  },
  matrix: {
    type: "matrix",
    surface: "drawer",
    displayName: "Matrix Editor",
    buttonText: "Matrix",
    group: "tables",
    isAvailable: ({ arity }) => arity <= 2,
    supportsFullscreen: false,
    toolbar: {},
    component: MatrixView,
  },
  database: {
    type: "database",
    surface: "drawer",
    displayName: "Database Table Editor",
    buttonText: "Database",
    group: "tables",
    isAvailable: ({ type, arity }) => arity <= 2 || type !== "function",
    supportsFullscreen: false,
    toolbar: { disabledFilters: ["domainSelector", "unaryFilterToggle"] },
    component: DatabaseView,
  },
  oriented: {
    type: "oriented",
    surface: "drawer",
    displayName: "Oriented Graph",
    buttonText: "Oriented",
    group: "graphs",
    isAvailable: isBinaryRelation,
    supportsFullscreen: true,
    toolbar: {},
    component: graphEditorAdapter("oriented"),
  },
  hasse: {
    type: "hasse",
    surface: "drawer",
    displayName: "Hasse Diagram",
    buttonText: "Hasse",
    group: "graphs",
    isAvailable: (tuple) =>
      isBinaryRelation(tuple) && tuple.type !== "function",
    supportsFullscreen: true,
    toolbar: {},
    component: graphEditorAdapter("hasse"),
  },
  bipartite: {
    type: "bipartite",
    surface: "drawer",
    displayName: "Bipartite Graph",
    buttonText: "Bipartite",
    group: "graphs",
    isAvailable: isBinaryRelation,
    supportsFullscreen: true,
    toolbar: {},
    component: graphEditorAdapter("bipartite"),
  },
};
