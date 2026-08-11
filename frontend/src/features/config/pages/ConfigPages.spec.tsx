import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NetworkMapPage from './NetworkMapPage';
import RulePage from './RulePage';
import TypologyPage from './TypologyPage';
import { configApi } from '../services/configApi';

vi.mock('../services/configApi', () => ({
  configApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    activateNetworkMap: vi.fn(),
    deactivateNetworkMap: vi.fn(),
    reloadNetworkMap: vi.fn(),
  },
}));

vi.mock('../components/NetworkMapConfigEditor', () => ({
  default: () => <div data-testid="nm-editor">Editor</div>,
}));
vi.mock('../components/RuleConfigEditor', () => ({
  default: () => <div data-testid="rule-editor">Editor</div>,
}));
vi.mock('../components/TypologyConfigEditor', () => ({
  default: () => <div data-testid="typo-editor">Editor</div>,
}));

vi.mock('../../auth/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'test', tenantId: 'DEFAULT' },
    isAuthenticated: true,
    loading: false,
  }),
}));

vi.mock('../../../shared/providers/ToastProvider', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

vi.mock('../../../common/Tables/CustomTable', () => ({
  default: ({ rows }: { rows: any[] }) => (
    <div data-testid="custom-table">Rows: {rows.length}</div>
  ),
}));

vi.mock('../../../shared/components/ui/Loader', () => ({
  default: () => <div data-testid="loader">Loading</div>,
}));

describe('Config Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configApi.list.mockResolvedValue({
      data: [{ id: '1', cfg: '1.0.0', name: 'test', active: true, messages: '[]', tenantId: 'DEFAULT' }],
      meta: { total: 1 },
    });
    configApi.create.mockResolvedValue({});
    configApi.update.mockResolvedValue({});
    configApi.delete.mockResolvedValue({});
    configApi.activateNetworkMap.mockResolvedValue({});
    configApi.deactivateNetworkMap.mockResolvedValue({});
    configApi.reloadNetworkMap.mockResolvedValue({});
  });

  describe('NetworkMapPage', () => {
    it('should render the page title', () => {
      render(
        <MemoryRouter initialEntries={['/network-map']}>
          <Routes>
            <Route path="*" element={<NetworkMapPage />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText('Network Map Configuration')).toBeInTheDocument();
    });

    it('should load and display records', async () => {
      render(
        <MemoryRouter initialEntries={['/network-map']}>
          <Routes>
            <Route path="*" element={<NetworkMapPage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
    });

    it('should open create dialog on Create New click', async () => {
      render(
        <MemoryRouter initialEntries={['/network-map']}>
          <Routes>
            <Route path="*" element={<NetworkMapPage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create New'));
      await waitFor(() => {
        expect(screen.getByText('Create Network Map')).toBeInTheDocument();
      });
    });

    it('should close create dialog on Cancel click', async () => {
      render(
        <MemoryRouter initialEntries={['/network-map']}>
          <Routes>
            <Route path="*" element={<NetworkMapPage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create New'));
      await waitFor(() => {
        expect(screen.getByText('Create Network Map')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(() => {
        expect(screen.queryByText('Create Network Map')).not.toBeInTheDocument();
      });
    });

    it('should save on Create button click', async () => {
      render(
        <MemoryRouter initialEntries={['/network-map']}>
          <Routes>
            <Route path="*" element={<NetworkMapPage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create New'));
      await waitFor(() => {
        expect(screen.getByText('Create Network Map')).toBeInTheDocument();
      });
      const nameInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(nameInput, { target: { value: 'test-nm' } });
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => {
        expect(screen.queryByText('Create Network Map')).not.toBeInTheDocument();
      });
    });
  });

  describe('RulePage', () => {
    it('should render the page title', () => {
      render(
        <MemoryRouter initialEntries={['/rule']}>
          <Routes>
            <Route path="*" element={<RulePage />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText('Rule Configuration')).toBeInTheDocument();
    });

    it('should load and display records', async () => {
      render(
        <MemoryRouter initialEntries={['/rule']}>
          <Routes>
            <Route path="*" element={<RulePage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
    });

    it('should open create dialog on Create New click', async () => {
      render(
        <MemoryRouter initialEntries={['/rule']}>
          <Routes>
            <Route path="*" element={<RulePage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create New'));
      await waitFor(() => {
        expect(screen.getByText('Create Rule')).toBeInTheDocument();
      });
    });

    it('should close create dialog on Cancel click', async () => {
      render(
        <MemoryRouter initialEntries={['/rule']}>
          <Routes>
            <Route path="*" element={<RulePage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create New'));
      await waitFor(() => {
        expect(screen.getByText('Create Rule')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(() => {
        expect(screen.queryByText('Create Rule')).not.toBeInTheDocument();
      });
    });

    it('should save on Create button click', async () => {
      render(
        <MemoryRouter initialEntries={['/rule']}>
          <Routes>
            <Route path="*" element={<RulePage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create New'));
      await waitFor(() => {
        expect(screen.getByText('Create Rule')).toBeInTheDocument();
      });
      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { value: 'test-rule' } });
      fireEvent.change(inputs[1], { target: { value: '1.0.0' } });
      fireEvent.change(inputs[2], { target: { value: 'Test rule' } });
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => {
        expect(screen.queryByText('Create Rule')).not.toBeInTheDocument();
      });
    });
  });

  describe('TypologyPage', () => {
    it('should render the page title', () => {
      render(
        <MemoryRouter initialEntries={['/typology']}>
          <Routes>
            <Route path="*" element={<TypologyPage />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText('Typology Configuration')).toBeInTheDocument();
    });

    it('should load and display records', async () => {
      render(
        <MemoryRouter initialEntries={['/typology']}>
          <Routes>
            <Route path="*" element={<TypologyPage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
    });

    it('should open create dialog on Create New click', async () => {
      render(
        <MemoryRouter initialEntries={['/typology']}>
          <Routes>
            <Route path="*" element={<TypologyPage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create New'));
      await waitFor(() => {
        expect(screen.getByText('Create Typology')).toBeInTheDocument();
      });
    });

    it('should close create dialog on Cancel click', async () => {
      render(
        <MemoryRouter initialEntries={['/typology']}>
          <Routes>
            <Route path="*" element={<TypologyPage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create New'));
      await waitFor(() => {
        expect(screen.getByText('Create Typology')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(() => {
        expect(screen.queryByText('Create Typology')).not.toBeInTheDocument();
      });
    });

    it('should save on Create button click', async () => {
      render(
        <MemoryRouter initialEntries={['/typology']}>
          <Routes>
            <Route path="*" element={<TypologyPage />} />
          </Routes>
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create New'));
      await waitFor(() => {
        expect(screen.getByText('Create Typology')).toBeInTheDocument();
      });
      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { value: 'test-typo' } });
      fireEvent.change(inputs[1], { target: { value: '1.0.0' } });
      fireEvent.change(inputs[2], { target: { value: 'Test typology' } });
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => {
        expect(screen.queryByText('Create Typology')).not.toBeInTheDocument();
      });
    });
  });
});
