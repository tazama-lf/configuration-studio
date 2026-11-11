import React from "react";

const makeIcon = (name: string) => {
  const Icon = (props: Record<string, unknown>) =>
    React.createElement("span", { "data-testid": `ri-${name}`, ...props });
  Icon.displayName = name;
  return Icon;
};

export const AiOutlineEye = makeIcon("AiOutlineEye");
export const AiOutlineEyeInvisible = makeIcon("AiOutlineEyeInvisible");
export const MdEmail = makeIcon("MdEmail");
export const MdLock = makeIcon("MdLock");
