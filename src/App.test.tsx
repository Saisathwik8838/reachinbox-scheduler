import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Smoke Test', () => {
  it('renders the scaffolded application and default route', () => {
    render(<App />);
    expect(screen.getByText(/Dashboard Scaffold/i)).toBeInTheDocument();
  });
});
