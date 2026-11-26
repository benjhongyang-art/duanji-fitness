import { useEffect, useRef, useState } from "react";
import { MetricDialog } from "@/components/MetricDialog";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useFitness } from "@/context/FitnessContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/cn";
import { formatDateKey } from "@/lib/dates";
import { parseBackup } from "@/lib/validate";
import type { AppData, ThemeMode } from "@/lib/types";

const REST_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240];
const THEMES: { id: ThemeMode; label: string }[] = [
  { id: "system", label: "跟隨系統" },
  { id: "light", label: "淺色" },
  { id: "dark", label: "深色" },
];

export function SettingsPage() {
  usePageTitle("設定");
  const { settings, updateSettings, exportData, importData, loadSample, clearAll, notify } = useFitness();
  const fileRef = useRef<HTMLInputElement>(null);
  const [metricOpen, setMetricOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [confirmSample, setConfirmSample] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const nav = navigator as Navigator & { standalone?: boolean };
    const update = () => setInstalled(media.matches || nav.standalone === true);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function download() {
    const payload = {
      app: "duanji",
      version: 1,
      exportedAt: new Date().toISOString(),
      ...exportData(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `duanji-${formatDateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify("已匯出備份");
  }

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseBackup(JSON.parse(String(reader.result)));
        if (!parsed) {
          notify("這份檔案不是鍛記的備份");
          return;
        }
        setPendingImport(parsed);
      } catch {
        notify("檔案讀取失敗");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <PageHeader kicker="只存在這台裝置" title="設定" />
      <div className="grid gap-6 px-4 pb-10">
        <section className="grid gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">外觀</h2>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => void updateSettings({ theme: theme.id })}
                className={cn(
                  "h-11 rounded-2xl text-sm",
                  settings.theme === theme.id ? "bg-foreground text-background" : "bg-muted",
                )}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </section>
        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">組間休息</h2>
              <p className="text-xs text-muted-foreground">完成一組後倒數，時間到會響</p>
            </div>
            <Switch
              checked={settings.restEnabled}
              onCheckedChange={(checked) => void updateSettings({ restEnabled: checked })}
              aria-label="開啟組間休息"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {REST_OPTIONS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                disabled={!settings.restEnabled}
                onClick={() => void updateSettings({ restSec: seconds })}
                className={cn(
                  "h-10 rounded-full px-3 text-sm disabled:opacity-40",
                  settings.restSec === seconds ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {seconds >= 60 && seconds % 60 === 0 ? `${seconds / 60} 分` : `${seconds} 秒`}
              </button>
            ))}
          </div>
        </section>
        <section className="grid gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">身體</h2>
          <Button variant="outline" onClick={() => setMetricOpen(true)}>
            記錄體重
          </Button>
        </section>
        <section className="grid gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">資料</h2>
          <Button variant="outline" onClick={download}>
            匯出備份
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            匯入備份
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onFile(file);
            }}
          />
          <Button variant="outline" data-testid="load-sample" onClick={() => setConfirmSample(true)}>
            載入示範資料
          </Button>
          <Button variant="ghost" className="text-destructive" onClick={() => setConfirmClear(true)}>
            清除全部資料
          </Button>
        </section>
        <section className="rounded-3xl bg-muted px-4 py-4 text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">鍛記</p>
          <p className="mt-1">
            訓練、課表和體重都存在瀏覽器的 IndexedDB，沒有帳號，也沒有伺服器。換手機或清掉網站資料前，先匯出備份。
          </p>
          <p className="mt-2">
            {installed
              ? "已加到主畫面，沒有網路也能打開。"
              : "用瀏覽器的「加入主畫面」或「安裝應用程式」，它會像一般 App 一樣離線打開。"}
          </p>
          <p className="mt-2">預估 1RM 使用 Epley 公式：重量 ×（1 + 次數 / 30）。</p>
        </section>
      </div>
      <MetricDialog open={metricOpen} onOpenChange={setMetricOpen} />
      <Sheet open={pendingImport != null} onOpenChange={(open) => { if (!open) setPendingImport(null); }} title="用這份備份覆蓋？" description="這台裝置上現在的訓練、課表和體重會被換掉。">
        <Button
          onClick={() => {
            if (!pendingImport) return;
            void importData(pendingImport).then(() => {
              setPendingImport(null);
              notify("已匯入備份");
            });
          }}
        >
          覆蓋並匯入
        </Button>
      </Sheet>
      <Sheet open={confirmSample} onOpenChange={setConfirmSample} title="載入示範資料？" description="會用約八週的推、拉、腿和體重紀錄取代目前的資料。">
        <Button
          onClick={() => {
            void loadSample().then(() => {
              setConfirmSample(false);
              notify("已載入示範資料");
            });
          }}
        >
          載入
        </Button>
      </Sheet>
      <Sheet open={confirmClear} onOpenChange={setConfirmClear} title="清除全部資料？" description="訓練、自訂動作和體重都會刪除。推、拉、腿課表會重新建立。建議先匯出備份。">
        <Button
          variant="destructive"
          onClick={() => {
            void clearAll().then(() => {
              setConfirmClear(false);
              notify("已清除");
            });
          }}
        >
          清除
        </Button>
      </Sheet>
    </div>
  );
}
