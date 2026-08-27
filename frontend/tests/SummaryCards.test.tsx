import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { SummaryCards } from '../src/components/SummaryCards';
import { api } from '../src/api/client';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('SummaryCards', () => {
  it('renderiza los contadores por estado y vigentes hoy', async () => {
    vi.spyOn(api, 'getSummary').mockResolvedValue({
      total: 4,
      porEstado: { SCHEDULED: 1, ACTIVE: 2, FINISHED: 1 },
      vigentesHoy: 2,
    });

    renderWithClient(<SummaryCards />);

    expect(await screen.findByText('Programada')).toBeInTheDocument();
    expect(screen.getByText('Vigentes hoy')).toBeInTheDocument();
    expect(screen.getAllByText('2')).toHaveLength(2); // ACTIVE y vigentesHoy
  });
});
