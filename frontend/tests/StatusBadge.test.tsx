import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from '../src/components/StatusBadge';

describe('StatusBadge', () => {
  it('muestra la etiqueta en español para cada estado', () => {
    render(<StatusBadge status="SCHEDULED" />);
    expect(screen.getByText('Programada')).toBeInTheDocument();
  });

  it('muestra "Activa" para el estado ACTIVE', () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  it('muestra "Finalizada" para el estado FINISHED', () => {
    render(<StatusBadge status="FINISHED" />);
    expect(screen.getByText('Finalizada')).toBeInTheDocument();
  });
});
