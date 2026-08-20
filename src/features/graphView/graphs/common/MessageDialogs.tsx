import type { ReactNode } from "react";

import MessageDialog from "../graphComponents/MessageDialog/MessageDialog";

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

export function InvalidPosetMessageDialog() {
  return (
    <MessageDialog
      type="error"
      position="center"
      title="Invalid poset"
      body="This predicate’s interpretation does not form a valid poset. Adjust it to enable this editor."
    />
  );
}

export function ConnectionWarningDialog({ warning }: { warning: ReactNode }) {
  if (!warning) return null;

  return <MessageDialog type="error" position="corner" body={warning} />;
}
