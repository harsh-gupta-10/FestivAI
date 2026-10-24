import { PublicInvite } from "@/components/PublicInvite";

interface InvitePageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: InvitePageProps) {
  return <PublicInvite params={params} />;
}
