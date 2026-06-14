import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { CustomersPage } from './pages/Customers';
import { OrdersPage } from './pages/Orders';
import { SegmentsPage } from './pages/Segments';
import { CampaignsPage } from './pages/Campaigns';
import { AIAgentPage } from './pages/AIAgent';
import { AnalyticsPage } from './pages/Analytics';
import { IntelligencePage } from './pages/Intelligence';
import { SettingsPage } from './pages/Settings';
import { AbandonedCartsPage } from './pages/AbandonedCarts';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/segments" element={<SegmentsPage />} />
                  <Route path="/campaigns" element={<CampaignsPage />} />
                  <Route path="/ai-agent" element={<AIAgentPage />} />
                  <Route path="/intelligence" element={<IntelligencePage />} />
                  <Route path="/abandoned-carts" element={<AbandonedCartsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
