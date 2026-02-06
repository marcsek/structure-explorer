import MessageDialog, {
  type MessageDialogProps,
} from "../graphComponents/MessageDialog/MessageDialog";

export function EmptyDomainMessageDialog() {
  return (
    <MessageDialog
      type="info"
      position="center"
      title="No nodes to display"
      body="The domain you have selected is empty."
    />
  );
}

export type ErrorMessageDialogBuilderProps =
  | {
      graphType: "oriented" | "bipartite";
      body: MessageDialogProps["body"];
    }
  | {
      graphType: "hasse";
      body: MessageDialogProps["body"];
      invalidPoset: boolean;
    };

export function ErrorMessageDialogBuilder(
  props: ErrorMessageDialogBuilderProps,
) {
  const { graphType, body } = props;

  if (graphType === "hasse" && props.invalidPoset) {
    return (
      <MessageDialog
        type="error"
        position="center"
        title="Invalid poset"
        body="This predicate’s interpretation does not form a valid poset. Adjust
            it to enable this editor."
      />
    );
  }

  return <MessageDialog type="error" position="corner" body={body} />;
}
