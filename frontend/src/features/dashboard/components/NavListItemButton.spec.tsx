import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NavListItemButton from './NavListItemButton';

const theme = createTheme();

describe('NavListItemButton (styled)', () => {
  it('should render without crashing when open', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <NavListItemButton open={true}>Item</NavListItemButton>
      </ThemeProvider>,
    );
    expect(container).toBeDefined();
  });

  it('should render without crashing when closed', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <NavListItemButton open={false}>Item</NavListItemButton>
      </ThemeProvider>,
    );
    expect(container).toBeDefined();
  });

  it('should render children content', () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <NavListItemButton open={true}>Test Item</NavListItemButton>
      </ThemeProvider>,
    );
    expect(getByText('Test Item')).toBeInTheDocument();
  });
});
