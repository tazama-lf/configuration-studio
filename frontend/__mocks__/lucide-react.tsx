import React from "react";

const makeIcon = (name: string) => {
  const Icon = (props: Record<string, unknown>) =>
    React.createElement("span", { "data-testid": `lucide-${name}`, ...props });
  Icon.displayName = name;
  return Icon;
};

export const ActivityIcon = makeIcon("ActivityIcon");
export const DatabaseIcon = makeIcon("DatabaseIcon");
export const PackageIcon = makeIcon("PackageIcon");
export const Layout = makeIcon("Layout");
export const LogOutIcon = makeIcon("LogOutIcon");
