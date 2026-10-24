import { EventDashboard } from "@/components/EventDashboard";

interface DashboardPageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: DashboardPageProps) {
  return <EventDashboard params={params} />;
}
