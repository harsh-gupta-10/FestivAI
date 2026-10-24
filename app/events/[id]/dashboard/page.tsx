import { EventDashboard } from "@/components/EventDashboard";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EventDashboard params={params} />;
}
