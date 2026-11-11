import React from "react";
import { render, screen } from "@testing-library/react";
import JsonPreviewPanel from "@/features/config/components/JsonPreviewPanel";

describe("JsonPreviewPanel", () => {
  it("renders JSON preview text", () => {
    const json = '{"test": true}';
    render(<JsonPreviewPanel json={json} />);
    expect(screen.getByText(json)).toBeInTheDocument();
  });

  it("renders empty JSON", () => {
    render(<JsonPreviewPanel json="{}" />);
    expect(screen.getByText("{}")).toBeInTheDocument();
  });
});
