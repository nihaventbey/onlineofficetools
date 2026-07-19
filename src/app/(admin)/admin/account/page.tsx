import { Suspense } from "react";
import AccountClient from "./AccountClient";

export default function AdminAccountPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <AccountClient />
    </Suspense>
  );
}
