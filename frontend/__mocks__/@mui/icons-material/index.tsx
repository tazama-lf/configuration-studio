import React from "react";

/**
 * @mui/icons-material mock for Jest tests.
 * Every icon is a simple span.
 */
const makeIcon = (name: string) => {
  const Icon = (props: Record<string, unknown>) =>
    React.createElement("span", { "data-testid": `icon-${name}`, ...props });
  Icon.displayName = name;
  return Icon;
};

export const Add = makeIcon("Add");
export const Edit = makeIcon("Edit");
export const Delete = makeIcon("Delete");
export const Visibility = makeIcon("Visibility");
export const ExpandMore = makeIcon("ExpandMore");
export const Close = makeIcon("Close");
export const Menu = makeIcon("Menu");
export const Search = makeIcon("Search");
export const ArrowBack = makeIcon("ArrowBack");
export const ArrowForward = makeIcon("ArrowForward");
export const Check = makeIcon("Check");
export const ChevronLeft = makeIcon("ChevronLeft");
export const ChevronRight = makeIcon("ChevronRight");
export const Clear = makeIcon("Clear");
export const Save = makeIcon("Save");
export const Settings = makeIcon("Settings");
export const Refresh = makeIcon("Refresh");
export const MoreVert = makeIcon("MoreVert");
export const Warning = makeIcon("Warning");
export const Error = makeIcon("Error");
export const Info = makeIcon("Info");
export const Success = makeIcon("Success");
export const FilterList = makeIcon("FilterList");
export const FirstPage = makeIcon("FirstPage");
export const LastPage = makeIcon("LastPage");
export const UnfoldMore = makeIcon("UnfoldMore");
export const Fullscreen = makeIcon("Fullscreen");
export const FullscreenExit = makeIcon("FullscreenExit");
export const Download = makeIcon("Download");
export const Upload = makeIcon("Upload");
export const ContentCopy = makeIcon("ContentCopy");
export const ContentPaste = makeIcon("ContentPaste");

// Default export — a simple span component so `import X from '@mui/icons-material/X'` works
export default makeIcon("Default");
