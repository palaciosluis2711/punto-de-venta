import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './core/layout/MainLayout';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { InventoryPage } from './modules/inventory/InventoryPage';
import { SuppliersPage } from './modules/suppliers/SuppliersPage';
import { PosPage } from './modules/pos/PosPage';
import { SettingsPage } from './modules/settings/SettingsPage';
import { PurchasesPage } from './modules/purchases/PurchasesPage';
import { PurchaseCreatePage } from './modules/purchases/PurchaseCreatePage';
import { PurchaseEditPage } from './modules/purchases/PurchaseEditPage';
import { TransfersPage } from './modules/transfers/TransfersPage';
import { TransferCreatePage } from './modules/transfers/TransferCreatePage';
import { TransferEditPage } from './modules/transfers/TransferEditPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="purchases/new" element={<PurchaseCreatePage />} />
          <Route path="purchases/edit/:id" element={<PurchaseEditPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="transfers/new" element={<TransferCreatePage />} />
          <Route path="transfers/edit/:id" element={<TransferEditPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
