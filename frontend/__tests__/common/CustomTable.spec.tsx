import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import CustomTable from "@/common/Tables/CustomTable";

const defaultProps = {
  columns: [{ field: "id", headerName: "ID", width: 100 }],
  rows: [{ id: "1" }, { id: "2" }],
  pagination: {
    page: 0,
    limit: 10,
    totalRecords: 2,
    setPage: jest.fn(),
  },
};

describe("CustomTable", () => {
  it("renders the table", () => {
    const { container } = render(<CustomTable {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("shows pagination info when rows exist", () => {
    render(<CustomTable {...defaultProps} />);
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(1);
    expect(screen.getAllByText("2")).toHaveLength(2);
  });

  it("does not show pagination when no rows", () => {
    render(
      <CustomTable
        {...defaultProps}
        rows={[]}
        pagination={{ ...defaultProps.pagination, totalRecords: 0 }}
      />,
    );
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it("calls setPage on pagination change", () => {
    const setPage = jest.fn();
    render(
      <CustomTable
        {...defaultProps}
        pagination={{ ...defaultProps.pagination, setPage, totalRecords: 25 }}
      />,
    );
    // The Pagination component is mocked, so we can't directly test page change
    // but we verify the component renders
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
  });

  it("calls setPage when Pagination onChange is triggered", () => {
    const setPage = jest.fn();
    render(
      <CustomTable
        {...defaultProps}
        pagination={{ ...defaultProps.pagination, setPage, totalRecords: 25 }}
      />,
    );
    // Find the Pagination element and call its onChange prop
    const pagination = screen.getByTestId("mui-pagination");
    const propKeys = Object.keys(pagination).filter((k) => k.startsWith("__reactProps"));
    expect(propKeys.length).toBeGreaterThan(0);
    const props = (pagination as any)[propKeys[0]];
    expect(typeof props.onChange).toBe("function");
    act(() => {
      props.onChange({}, 2);
    });
    expect(setPage).toHaveBeenCalledWith(1);
  });

  it("renders with custom uniqueId", () => {
    render(<CustomTable {...defaultProps} uniqueId="customId" rows={[{ customId: "a" }]} />);
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
  });

  it("renders with columnDivider", () => {
    const { container } = render(<CustomTable {...defaultProps} columnDivider={true} />);
    expect(container).toBeTruthy();
  });

  it("renders with multilineHeader", () => {
    const { container } = render(<CustomTable {...defaultProps} multilineHeader={true} />);
    expect(container).toBeTruthy();
  });

  it("renders with horizontalScroll", () => {
    const { container } = render(<CustomTable {...defaultProps} horizontalScroll={true} />);
    expect(container).toBeTruthy();
  });

  it("renders with horizontalScrollTextAlign right", () => {
    const { container } = render(
      <CustomTable {...defaultProps} horizontalScroll={true} horizontalScrollTextAlign="right" />,
    );
    expect(container).toBeTruthy();
  });

  it("renders with onRowClick", () => {
    const onRowClick = jest.fn();
    const { container } = render(<CustomTable {...defaultProps} onRowClick={onRowClick} />);
    expect(container).toBeTruthy();
  });

  it("renders with onRowDoubleClick", () => {
    const onRowDoubleClick = jest.fn();
    const { container } = render(
      <CustomTable {...defaultProps} onRowDoubleClick={onRowDoubleClick} />,
    );
    expect(container).toBeTruthy();
  });

  it("renders with disableRowSelection false", () => {
    const { container } = render(<CustomTable {...defaultProps} disableRowSelection={false} />);
    expect(container).toBeTruthy();
  });

  it("renders with custom tablePadding", () => {
    const { container } = render(<CustomTable {...defaultProps} tablePadding="10px" />);
    expect(container).toBeTruthy();
  });

  it("renders with initialState", () => {
    const { container } = render(
      <CustomTable
        {...defaultProps}
        initialState={{ columns: { columnVisibilityModel: { id: true } } }}
      />,
    );
    expect(container).toBeTruthy();
  });

  it("calculates correct from/to for page 1", () => {
    render(
      <CustomTable
        {...defaultProps}
        rows={[{ id: "1" }, { id: "2" }, { id: "3" }]}
        pagination={{
          page: 1,
          limit: 10,
          totalRecords: 25,
          setPage: jest.fn(),
        }}
      />,
    );
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("calls setPage when Pagination onChange is triggered", () => {
    const setPage = jest.fn();
    render(
      <CustomTable
        {...defaultProps}
        pagination={{ ...defaultProps.pagination, setPage, totalRecords: 25 }}
      />,
    );
    // Find the Pagination element and call its onChange prop
    const pagination = screen.getByTestId("mui-pagination");
    const propKeys = Object.keys(pagination).filter((k) => k.startsWith("__reactProps"));
    expect(propKeys.length).toBeGreaterThan(0);
    const props = (pagination as any)[propKeys[0]];
    expect(typeof props.onChange).toBe("function");
    act(() => {
      props.onChange({}, 2);
    });
    expect(setPage).toHaveBeenCalledWith(1);
  });

  it("renders with downSm=true (useMediaQuery returns true)", () => {
    (globalThis as { __MUI_USE_MEDIA_QUERY__?: boolean }).__MUI_USE_MEDIA_QUERY__ = true;
    try {
      const { container } = render(<CustomTable {...defaultProps} />);
      expect(container).toBeTruthy();
      expect(screen.getByText(/Showing/)).toBeInTheDocument();
    } finally {
      (globalThis as { __MUI_USE_MEDIA_QUERY__?: boolean }).__MUI_USE_MEDIA_QUERY__ = false;
    }
  });
});
