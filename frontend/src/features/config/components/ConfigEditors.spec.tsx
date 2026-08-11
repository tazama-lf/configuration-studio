import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NetworkMapConfigEditor from './NetworkMapConfigEditor';
import RuleConfigEditor from './RuleConfigEditor';
import TypologyConfigEditor from './TypologyConfigEditor';

vi.mock('../services/configApi', () => ({
  configApi: {
    list: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    activateNetworkMap: vi.fn().mockResolvedValue({}),
    deactivateNetworkMap: vi.fn().mockResolvedValue({}),
    reloadNetworkMap: vi.fn().mockResolvedValue({}),
  },
}));

describe('Config Editors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('NetworkMapConfigEditor', () => {
    it('should render with default props', () => {
      const { container } = render(
        <NetworkMapConfigEditor value="[]" onChange={vi.fn()} />,
      );
      expect(container).toBeDefined();
    });

    it('should render in readOnly mode', () => {
      const { container } = render(
        <NetworkMapConfigEditor value="[]" onChange={vi.fn()} readOnly={true} />,
      );
      expect(container).toBeDefined();
    });

    it('should render with messages value', () => {
      const messages = JSON.stringify([
        { id: 'msg1', cfg: '1.0.0', txTp: 'pacs.008', typologies: [] },
      ]);
      const { container } = render(
        <NetworkMapConfigEditor value={messages} onChange={vi.fn()} />,
      );
      expect(container).toBeDefined();
    });

    it('should add a message on Add Message click', () => {
      render(
        <NetworkMapConfigEditor value="[]" onChange={vi.fn()} />,
      );
      fireEvent.click(screen.getByText('Add Message'));
      expect(screen.getAllByText(/Message/).length).toBeGreaterThan(0);
    });
  });

  describe('RuleConfigEditor', () => {
    it('should render with default props', () => {
      const { container } = render(
        <RuleConfigEditor value="{}" onChange={vi.fn()} />,
      );
      expect(container).toBeDefined();
    });

    it('should render in readOnly mode', () => {
      const { container } = render(
        <RuleConfigEditor value="{}" onChange={vi.fn()} readOnly={true} />,
      );
      expect(container).toBeDefined();
    });

    it('should render with bands config', () => {
      const config = JSON.stringify({
        bands: [{ subRuleRef: 'sub1', reason: 'test', lowerLimit: 0, upperLimit: 100 }],
      });
      const { container } = render(
        <RuleConfigEditor value={config} onChange={vi.fn()} />,
      );
      expect(container).toBeDefined();
    });

    it('should render with exitConditions config', () => {
      const config = JSON.stringify({
        exitConditions: [{ subRuleRef: 'sub1', reason: 'exit' }],
      });
      const { container } = render(
        <RuleConfigEditor value={config} onChange={vi.fn()} />,
      );
      expect(container).toBeDefined();
    });

    it('should add a parameter on Add Parameter click', () => {
      render(
        <RuleConfigEditor value="{}" onChange={vi.fn()} />,
      );
      fireEvent.click(screen.getByText('Add Parameter'));
      expect(screen.getAllByText(/Parameter/).length).toBeGreaterThan(0);
    });

    it('should add an exit condition on Add Exit Condition click', () => {
      render(
        <RuleConfigEditor value="{}" onChange={vi.fn()} />,
      );
      fireEvent.click(screen.getByText('Add Exit Condition'));
      expect(screen.getAllByText(/Exit/).length).toBeGreaterThan(0);
    });

    it('should add a band on Add Band click', () => {
      render(
        <RuleConfigEditor value="{}" onChange={vi.fn()} />,
      );
      fireEvent.click(screen.getByText('Add Band'));
      expect(screen.getAllByText(/Band/).length).toBeGreaterThan(0);
    });

    it('should switch to Cases config type on Cases toggle click', () => {
      render(
        <RuleConfigEditor value="{}" onChange={vi.fn()} />,
      );
      fireEvent.click(screen.getByText('Cases'));
      expect(screen.getByText('Alternative (Fallback)')).toBeInTheDocument();
    });

    it('should add a case expression on Add Expression click', () => {
      render(
        <RuleConfigEditor value="{}" onChange={vi.fn()} />,
      );
      fireEvent.click(screen.getByText('Cases'));
      fireEvent.click(screen.getByText('Add Expression'));
      expect(screen.getAllByText(/Expression/).length).toBeGreaterThan(0);
    });
  });

  describe('TypologyConfigEditor', () => {
    it('should render with default props', () => {
      const { container } = render(
        <TypologyConfigEditor value="{}" onChange={vi.fn()} />,
      );
      expect(container).toBeDefined();
    });

    it('should render in readOnly mode', () => {
      const { container } = render(
        <TypologyConfigEditor value="{}" onChange={vi.fn()} readOnly={true} />,
      );
      expect(container).toBeDefined();
    });

    it('should render with rules config', () => {
      const config = JSON.stringify({
        rules: [{ id: 'rule1', cfg: '1.0.0', wghts: [], termId: 'term1' }],
      });
      const { container } = render(
        <TypologyConfigEditor value={config} onChange={vi.fn()} />,
      );
      expect(container).toBeDefined();
    });

    it('should add a rule on Add Rule click', () => {
      render(
        <TypologyConfigEditor value="{}" onChange={vi.fn()} />,
      );
      fireEvent.click(screen.getByText('Add Rule'));
      expect(screen.getAllByText(/Rule/).length).toBeGreaterThan(0);
    });

    it('should add a weight on Add Weight click', () => {
      const config = JSON.stringify({
        rules: [{ id: 'rule1', cfg: '1.0.0', wghts: [], termId: 'term1' }],
      });
      render(
        <TypologyConfigEditor value={config} onChange={vi.fn()} />,
      );
      fireEvent.click(screen.getByText('Add Weight'));
      expect(screen.getAllByText(/Weight/).length).toBeGreaterThan(0);
    });
  });
});
