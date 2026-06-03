import { env } from "../config/env.js";

type JobFn = () => Promise<void>;

interface ScheduledJob {
  name: string;
  fn: JobFn;
  intervalMs: number;
  runOnStart?: boolean;
}

const timers: ReturnType<typeof setInterval>[] = [];

export function startScheduler(): void {
  if (env.NODE_ENV === "test") return;

  const jobs: ScheduledJob[] = [
    {
      name: "low-stock-alert",
      fn: async () => {
        const { runLowStockAlertJob } = await import("./low-stock-alert.job.js");
        await runLowStockAlertJob();
      },
      intervalMs: 60 * 60 * 1000,
      runOnStart: false,
    },
    {
      name: "daily-summary",
      fn: async () => {
        const { runDailySummaryJob } = await import("./daily-summary.job.js");
        await runDailySummaryJob();
      },
      intervalMs: 24 * 60 * 60 * 1000,
      runOnStart: false,
    },
  ];

  for (const job of jobs) {
    if (job.runOnStart) {
      job.fn().catch((err) => console.error(`[scheduler] ${job.name} failed on start:`, err));
    }

    const timer = setInterval(() => {
      job.fn().catch((err) => console.error(`[scheduler] ${job.name} failed:`, err));
    }, job.intervalMs);

    timers.push(timer);
    console.info(`[scheduler] ${job.name} scheduled every ${job.intervalMs / 60_000}min`);
  }
}

export function stopScheduler(): void {
  timers.forEach(clearInterval);
  timers.length = 0;
}