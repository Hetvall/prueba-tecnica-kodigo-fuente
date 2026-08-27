import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { PromotionForm } from '../src/components/PromotionForm';
import { api, ApiError } from '../src/api/client';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('PromotionForm', () => {
  it('muestra el mensaje de error del servidor cuando la creación falla', async () => {
    vi.spyOn(api, 'listProducts').mockResolvedValue([
      { id: 'p1', name: 'Producto 1', categoryId: 'c1', category: { id: 'c1', name: 'Cat 1' } },
    ]);
    vi.spyOn(api, 'listCategories').mockResolvedValue([{ id: 'c1', name: 'Cat 1' }]);
    vi.spyOn(api, 'createPromotion').mockRejectedValue(
      new ApiError('La fecha de fin debe ser posterior a la fecha de inicio.'),
    );

    const user = userEvent.setup();
    renderWithClient(<PromotionForm />);

    await user.type(screen.getByLabelText('Nombre'), 'Promo Test');
    await user.selectOptions(await screen.findByRole('combobox', { name: 'Producto' }), 'p1');
    await user.type(screen.getByLabelText(/Valor del descuento/), '10');
    await user.type(screen.getByLabelText('Fecha de inicio'), '2026-02-10');
    await user.type(screen.getByLabelText('Fecha de fin'), '2026-02-01');
    await user.click(screen.getByRole('button', { name: /crear promoción/i }));

    await waitFor(() => {
      expect(
        screen.getByText('La fecha de fin debe ser posterior a la fecha de inicio.'),
      ).toBeInTheDocument();
    });
  });
});
