import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Drawer from './Drawer';

const theme = createTheme();

describe('Drawer (styled)', () => {
  it('should render without crashing when open', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Drawer variant="permanent" open={true}>
          <div>Content</div>
        </Drawer>
      </ThemeProvider>,
    );
    expect(container).toBeDefined();
  });

  it('should render without crashing when closed', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Drawer variant="permanent" open={false}>
          <div>Content</div>
        </Drawer>
      </ThemeProvider>,
    );
    expect(container).toBeDefined();
  });
});
