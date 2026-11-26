import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Shell } from "@/components/Shell";
import { FitnessProvider } from "@/context/FitnessContext";
import { ActiveWorkoutPage } from "@/pages/ActiveWorkoutPage";
import { HistoryDetailPage } from "@/pages/HistoryDetailPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { HomePage } from "@/pages/HomePage";
import { RoutinePage } from "@/pages/RoutinePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TrainPage } from "@/pages/TrainPage";

const ProgressPage = lazy(() => import("@/pages/ProgressPage").then((module) => ({ default: module.ProgressPage })));

export default function App() {
  return (
    <BrowserRouter>
      <FitnessProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="train" element={<TrainPage />} />
            <Route path="train/routine/:id" element={<RoutinePage />} />
            <Route path="workout" element={<ActiveWorkoutPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="history/:id" element={<HistoryDetailPage />} />
            <Route
              path="progress"
              element={
                <Suspense fallback={<p className="px-4 pt-16 text-sm text-muted-foreground">正在載入曲線…</p>}>
                  <ProgressPage />
                </Suspense>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </FitnessProvider>
    </BrowserRouter>
  );
}
