import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  TableOuter,
  TableWrapper,
  PaginationContainer,
  PaginationText,
  PaginationBold,
} from './Table.styles';

const theme = createTheme();

describe('Table.styles', () => {
  it('should render TableOuter with paddingValue', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <TableOuter paddingValue="0 10px">Content</TableOuter>
      </ThemeProvider>,
    );
    expect(container).toBeDefined();
  });

  it('should render TableWrapper', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <TableWrapper>Content</TableWrapper>
      </ThemeProvider>,
    );
    expect(container).toBeDefined();
  });

  it('should render PaginationContainer', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <PaginationContainer>Content</PaginationContainer>
      </ThemeProvider>,
    );
    expect(container).toBeDefined();
  });

  it('should render PaginationText', () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <PaginationText>Page Info</PaginationText>
      </ThemeProvider>,
    );
    expect(getByText('Page Info')).toBeInTheDocument();
  });

  it('should render PaginationBold', () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <PaginationBold>42</PaginationBold>
      </ThemeProvider>,
    );
    expect(getByText('42')).toBeInTheDocument();
  });
});
