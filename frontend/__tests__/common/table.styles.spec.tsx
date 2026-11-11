import React from "react";
import { render } from "@testing-library/react";
import {
  TableOuter,
  TableWrapper,
  PaginationContainer,
  PaginationText,
  PaginationBold,
  StyledDataGrid,
} from "@/common/Tables/CustomTable/Table.styles";

describe("Table.styles", () => {
  it("TableOuter renders with paddingValue", () => {
    const { container } = render(
      <TableOuter paddingValue="10px">
        <div />
      </TableOuter>,
    );
    expect(container).toBeTruthy();
  });

  it("TableWrapper renders", () => {
    const { container } = render(
      <TableWrapper>
        <div />
      </TableWrapper>,
    );
    expect(container).toBeTruthy();
  });

  it("PaginationContainer renders", () => {
    const { container } = render(
      <PaginationContainer>
        <div />
      </PaginationContainer>,
    );
    expect(container).toBeTruthy();
  });

  it("PaginationText renders", () => {
    const { container } = render(<PaginationText>text</PaginationText>);
    expect(container).toBeTruthy();
  });

  it("PaginationBold renders", () => {
    const { container } = render(<PaginationBold>bold</PaginationBold>);
    expect(container).toBeTruthy();
  });

  it("StyledDataGrid renders with multilineHeader", () => {
    const { container } = render(<StyledDataGrid multilineHeader={true} rows={[]} columns={[]} />);
    expect(container).toBeTruthy();
  });

  it("StyledDataGrid renders with horizontalScroll", () => {
    const { container } = render(<StyledDataGrid horizontalScroll={true} rows={[]} columns={[]} />);
    expect(container).toBeTruthy();
  });

  it("StyledDataGrid renders with horizontalScrollTextAlign right", () => {
    const { container } = render(
      <StyledDataGrid horizontalScrollTextAlign="right" rows={[]} columns={[]} />,
    );
    expect(container).toBeTruthy();
  });

  it("StyledDataGrid renders with all props", () => {
    const { container } = render(
      <StyledDataGrid
        multilineHeader={true}
        horizontalScroll={true}
        horizontalScrollTextAlign="left"
        rows={[]}
        columns={[]}
      />,
    );
    expect(container).toBeTruthy();
  });

  it("StyledDataGrid renders without optional props", () => {
    const { container } = render(<StyledDataGrid rows={[]} columns={[]} />);
    expect(container).toBeTruthy();
  });
});
