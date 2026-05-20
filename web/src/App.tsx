import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { type ReactNode } from "react";

import Login from "./pages/admin/Login";
import PublicList from "./pages/public/List";
import AdminLayout from "./components/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import Pending from "./pages/admin/Pending";
import Links from "./pages/admin/Links";
import AddLink from "./pages/admin/AddLink";
import AiSettings from "./pages/admin/AiSettings";
import TokenSettings from "./pages/admin/TokenSettings";
import CategorySettings from "./pages/admin/CategorySettings";
import Download from "./pages/admin/Download";
import Logs from "./pages/admin/Logs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<PublicList />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="pending" element={<Pending />} />
              <Route path="links" element={<Links />} />
              <Route path="add" element={<AddLink />} />
              <Route path="settings/ai" element={<AiSettings />} />
              <Route path="settings/token" element={<TokenSettings />} />
              <Route path="settings/category" element={<CategorySettings />} />
              <Route path="tools/download" element={<Download />} />
              <Route path="tools/logs" element={<Logs />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">404</h1>
                    <p>页面未找到</p>
                  </div>
                </div>
              }
            />
          </Routes>
          <Toaster position="top-center" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
