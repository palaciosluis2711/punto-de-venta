import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './core/layout/MainLayout';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { InventoryPage } from './modules/inventory/InventoryPage';
import { SuppliersPage } from './modules/suppliers/SuppliersPage';
import { PosPage } from './modules/pos/PosPage';
import { SettingsPage } from './modules/settings/SettingsPage';

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
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
