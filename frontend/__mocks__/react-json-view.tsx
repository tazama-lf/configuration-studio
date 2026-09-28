import React from "react";

export default (props: Record<string, unknown>) =>
  React.createElement("div", { "data-testid": "react-json-view", ...props });
