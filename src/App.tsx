import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "suppliers", element: <SuppliersPage /> },
      { path: "pos", element: <PosPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "purchases", element: <PurchasesPage /> },
      { path: "purchases/new", element: <PurchaseCreatePage /> },
      { path: "purchases/edit/:id", element: <PurchaseEditPage /> },
      { path: "transfers", element: <TransfersPage /> },
      { path: "transfers/new", element: <TransferCreatePage /> },
      { path: "transfers/edit/:id", element: <TransferEditPage /> },
      { path: "*", element: <Navigate to="/" replace /> }
    ]
  }
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true
  }
});

function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}

export default App;
