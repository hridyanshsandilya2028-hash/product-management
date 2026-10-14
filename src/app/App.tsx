import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { ModePicker } from "../features/onboarding/ModePicker";
import { BriefDashboard } from "../features/briefing/BriefDashboard";
import { ContingencyDetail } from "../features/briefing/ContingencyDetail";
import { AlertsPage } from "../features/alerts/AlertsPage";
import { DebriefPage } from "../features/debrief/DebriefPage";
import { PlanPage } from "../features/planner/PlanPage";
import { WarRoomPage } from "../features/warroom/WarRoomPage";
import { SettingsPage } from "../features/settings/SettingsPage";

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
      <Routes>
        <Route path="/" element={<ModePicker />} />
        <Route element={<AppLayout />}>
          <Route path="/brief" element={<BriefDashboard />} />
          <Route path="/brief/:id" element={<ContingencyDetail />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/debrief" element={<DebriefPage />} />
          <Route path="/warroom" element={<WarRoomPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
