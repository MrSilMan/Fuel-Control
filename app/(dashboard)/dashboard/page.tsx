import { Header } from "@/components/layout/Header";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
        <DashboardClient />
      </div>
    </div>
  );
}
