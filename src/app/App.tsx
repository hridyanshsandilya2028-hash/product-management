import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppLayout } from "./layout/AppLayout";
import { ModePicker } from "../features/onboarding/ModePicker";
import { BriefDashboard } from "../features/briefing/BriefDashboard";
import { ContingencyDetail } from "../features/briefing/ContingencyDetail";
import { AlertsPage } from "../features/alerts/AlertsPage";
import { DebriefPage } from "../features/debrief/DebriefPage";
import { PlanPage } from "../features/planner/PlanPage";
import { WarRoomPage } from "../features/warroom/WarRoomPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { AuthPage } from "../features/auth/AuthPage";
import { supabase } from "../services/supabaseClient";
import { loadCurrentUserProfile, saveCurrentUserProfile } from "../services/profileService";
import { useAppStore } from "../store/useAppStore";

function Placeholder({ title }: { title: string }) {
  return (
    <section className="page-shell">
      <p className="eyebrow">CONTINGENCY GENIUS</p>
      <h1>{title}</h1>
      <p className="muted">This workspace is being prepared for the next phase.</p>
    </section>
  );
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SessionRoutes />
    </BrowserRouter>
  );
}

function SessionRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState(!supabase);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const setProfile = useAppStore((state) => state.setProfile);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      setIsAuthenticated(Boolean(data.session));
      if (data.session) {
        const profile = await loadCurrentUserProfile();
        if (profile) setProfile(profile);
        else await saveCurrentUserProfile(useAppStore.getState().profile);
      }
      setSessionReady(true);
    }).catch(() => setSessionReady(true));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setSessionReady(true);
      if (!session) navigate("/", { replace: true });
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  if (!sessionReady) return <main className="auth-loading">Preparing your private workspace…</main>;
  if (!isAuthenticated) {
    return <Routes><Route path="*" element={<AuthPage />} /></Routes>;
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<ModePicker />} />
      <Route element={<AppLayout />}>
        <Route path="/brief" element={<BriefDashboard />} />
        <Route path="/brief/:id" element={<ContingencyDetail />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/debrief" element={<DebriefPage />} />
        <Route path="/warroom" element={<WarRoomPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Route>
    </Routes>
  );
}
