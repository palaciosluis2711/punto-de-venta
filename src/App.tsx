import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ToastProvider } from './shared/components/Toast/ToastProvider';
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
import { ClientsPage } from './modules/clients/ClientsPage';
import { SalesPage } from './modules/sales/SalesPage';
import { NotificationsPage } from './modules/notifications/NotificationsPage';
import { QuotesPage } from './modules/quotes/QuotesPage';
import { QuoteCreatePage } from './modules/quotes/QuoteCreatePage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "suppliers", element: <SuppliersPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "pos", element: <PosPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "purchases", element: <PurchasesPage /> },
      { path: "purchases/new", element: <PurchaseCreatePage /> },
      { path: "purchases/edit/:id", element: <PurchaseEditPage /> },
      { path: "transfers", element: <TransfersPage /> },
      { path: "transfers/new", element: <TransferCreatePage /> },
      { path: "transfers/edit/:id", element: <TransferEditPage /> },
      { path: "sales", element: <SalesPage /> },
      { path: "quotes", element: <QuotesPage /> },
      { path: "quotes/new", element: <QuoteCreatePage /> },
      { path: "quotes/edit/:id", element: <QuoteCreatePage /> },
      { path: "notifications", element: <NotificationsPage /> },
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
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;
