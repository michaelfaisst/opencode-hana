import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "@/providers";
import { RootLayout } from "@/components/layout";
import { HomePage, SettingsPage } from "@/routes";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/sessions" element={<Navigate to="/" replace />} />
            <Route path="/sessions/:id" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </AppProviders>
  );
}

export default App;
