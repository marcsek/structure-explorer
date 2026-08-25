import { caseTreeOutOfSync } from "../caseTreeView/caseTreeError";
import CaseTreeView from "../caseTreeView/components/CaseTreeView";
import DatabaseView from "../databaseView/DatabaseView";
import {
  interpretationError,
  unfixableInterpretationError,
} from "../drawerEditor/interpretationError";
import {
  drawerEditorAdapter,
  type RenderDrawerEditor,
} from "../drawerEditor/drawerEditorAdapter";
import GraphView from "../graphView/GraphView";
import type { GraphType } from "../graphView/graphs/registry";
import MatrixView from "../matrixView/MatrixView";
import type { TupleInfo } from "../structure/tupleInfo";
import { textEditorAdapter } from "../textView/textEditorAdapter";
import type { EditorDescriptor } from "./editorDescriptor";
import type { EditorType } from "./editorTypes";

const renderGraphEditor =
  (type: GraphType): RenderDrawerEditor =>
  (props) => <GraphView {...props} graphType={type} />;

const correctedArity = ({ type, arity }: TupleInfo) =>
  type === "function" ? arity + 1 : arity;

const isBinaryRelation = (tuple: TupleInfo) => correctedArity(tuple) === 2;

export const editorDescriptors: Record<EditorType, EditorDescriptor> = {
  text: textEditorAdapter({
    type: "text",
    displayName: "Set",
    buttonText: "Set (default)",
    isAvailable: () => true,
  }),
  caseTree: drawerEditorAdapter({
    type: "caseTree",
    displayName: "Case Tree",
    buttonText: "Case Tree",
    isAvailable: ({ type }) => type === "function",
    supportsFullscreen: false,
    toolbar: false,
    errors: [caseTreeOutOfSync, unfixableInterpretationError],
    render: (props) => <CaseTreeView {...props} />,
  }),
  matrix: drawerEditorAdapter({
    type: "matrix",
    displayName: "Matrix Table",
    buttonText: "Matrix Table",
    group: "tables",
    isAvailable: ({ arity }) => arity <= 2,
    supportsFullscreen: false,
    toolbar: {},
    errors: [interpretationError],
    render: (props) => <MatrixView {...props} />,
  }),
  database: drawerEditorAdapter({
    type: "database",
    displayName: "Database Table",
    buttonText: "Database Table",
    group: "tables",
    isAvailable: ({ type, arity }) => arity <= 2 || type !== "function",
    supportsFullscreen: false,
    toolbar: { disabledFilters: ["domainSelector", "unaryFilterToggle"] },
    errors: [interpretationError],
    render: (props) => <DatabaseView {...props} />,
  }),
  oriented: drawerEditorAdapter({
    type: "oriented",
    displayName: "Oriented Graph",
    buttonText: "Oriented Graph",
    group: "graphs",
    isAvailable: isBinaryRelation,
    supportsFullscreen: true,
    toolbar: {},
    errors: [interpretationError],
    render: renderGraphEditor("oriented"),
  }),
  hasse: drawerEditorAdapter({
    type: "hasse",
    displayName: "Hasse Diagram",
    buttonText: "Hasse Diagram",
    group: "graphs",
    isAvailable: (tuple) =>
      isBinaryRelation(tuple) && tuple.type !== "function",
    supportsFullscreen: true,
    toolbar: {},
    errors: [interpretationError],
    render: renderGraphEditor("hasse"),
  }),
  bipartite: drawerEditorAdapter({
    type: "bipartite",
    displayName: "Bipartite Graph",
    buttonText: "Bipartite Graph",
    group: "graphs",
    isAvailable: isBinaryRelation,
    supportsFullscreen: true,
    toolbar: {},
    errors: [interpretationError],
    render: renderGraphEditor("bipartite"),
  }),
};
