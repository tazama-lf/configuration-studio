import React from "react";

/**
 * @mui/x-data-grid mock for Jest tests.
 */

export const DataGrid = (props: Record<string, unknown>) => {
  // Call getRowId for each row to cover the callback
  const rows = (props.rows as unknown[]) ?? [];
  const getRowId = props.getRowId as ((row: unknown) => unknown) | undefined;
  if (getRowId) {
    rows.forEach((row) => getRowId(row));
  }
  return React.createElement("div", { "data-testid": "data-grid", ...props });
};

export const GridToolbar = () => null;

// Types (erased at runtime)
export type GridColDef = Record<string, unknown>;
export type GridInitialState = Record<string, unknown>;
export type GridRowId = string | number;
export type GridRowParams = Record<string, unknown>;
export type GridRenderCellParams = Record<string, unknown>;
export type GridValueGetterParams = Record<string, unknown>;
export type GridRowSelectionModel = unknown;
export type GridCallbackDetails = Record<string, unknown>;
export type GridEventListener = (...args: unknown[]) => void;
export type GridEventPublisher = (...args: unknown[]) => void;

export default { DataGrid, GridToolbar };
