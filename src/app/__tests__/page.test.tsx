// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('HomePage', () => {
  it('renders the Racha dos Horríveis heading and main feature sections', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { name: /Racha dos Horríveis/i })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { name: /Artilharia & Assistências/i })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { name: /Histórico de Partidas/i })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { name: /Presença & Desempenho/i })
    ).toBeDefined();
  });
});
