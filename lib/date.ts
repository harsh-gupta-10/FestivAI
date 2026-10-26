/**
 * Celebration Date & Schedule Intelligence Helper
 */
export function formatCelebrationDate(dateStr?: string): {
  formatted: string;
  diffDays: number;
  statusText: string;
} {
  if (!dateStr) return { formatted: "TBD", diffDays: 0, statusText: "🗓️ Date pending" };
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const formatted = target.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let statusText = `⏳ **${diffDays} days to go**`;
    if (diffDays === 0) statusText = "🎉 **Today is celebration day!**";
    else if (diffDays === 1) statusText = "⏳ **Tomorrow is celebration day!**";
    else if (diffDays < 0) statusText = `🏁 **Celebration concluded ${Math.abs(diffDays)} day(s) ago**`;

    return { formatted, diffDays, statusText };
  } catch {
    return { formatted: dateStr, diffDays: 0, statusText: "🗓️ Scheduled" };
  }
}
