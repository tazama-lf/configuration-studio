import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CustomTable from './index';
import type { GridColDef } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'name', headerName: 'Name', width: 150 },
];

const rows = [
  { id: '1', name: 'Test 1' },
  { id: '2', name: 'Test 2' },
];

const defaultPagination = {
  page: 0,
  limit: 10,
  totalRecords: 2,
  setPage: vi.fn(),
};

describe('CustomTable', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <CustomTable columns={columns} rows={rows} pagination={defaultPagination} />,
    );
    expect(container).toBeDefined();
  });

  it('should render with empty rows', () => {
    const { container } = render(
      <CustomTable
        columns={columns}
        rows={[]}
        pagination={{ ...defaultPagination, totalRecords: 0 }}
      />,
    );
    expect(container).toBeDefined();
  });

  it('should show pagination text when rows exist', () => {
    render(
      <CustomTable columns={columns} rows={rows} pagination={defaultPagination} />,
    );
    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText(/results/i)).toBeInTheDocument();
  });

  it('should not show pagination text when rows are empty', () => {
    render(
      <CustomTable
        columns={columns}
        rows={[]}
        pagination={{ ...defaultPagination, totalRecords: 0 }}
      />,
    );
    expect(screen.queryByText(/Showing/i)).not.toBeInTheDocument();
  });

  it('should use custom uniqueId for row identification', () => {
    const customRows = [{ customId: 'a', name: 'Custom' }];
    const { container } = render(
      <CustomTable
        uniqueId="customId"
        columns={[{ field: 'name', headerName: 'Name', width: 150 }]}
        rows={customRows}
        pagination={defaultPagination}
      />,
    );
    expect(container).toBeDefined();
  });

  it('should calculate correct pagination display values', () => {
    render(
      <CustomTable
        columns={columns}
        rows={rows}
        pagination={{
          page: 1,
          limit: 10,
          totalRecords: 25,
          setPage: vi.fn(),
        }}
      />,
    );
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });
});
