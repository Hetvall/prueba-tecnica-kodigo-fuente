import { SummaryCards } from './components/SummaryCards';
import { PromotionForm } from './components/PromotionForm';
import { PromotionList } from './components/PromotionList';

export function App() {
  return (
    <div className="app">
      <header>
        <h1>Gestión de Promociones</h1>
        <p>Registra y controla el estado y la vigencia de las promociones de tus productos.</p>
      </header>

      <SummaryCards />

      <main className="app__grid">
        <PromotionForm />
        <PromotionList />
      </main>
    </div>
  );
}
