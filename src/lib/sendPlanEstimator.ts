/**
 * Pure send-plan estimation utility.
 * Simulates sending batches across clock-hour quota windows with minimum delay intervals.
 */

export interface SendPlanParams {
  recipientCount: number;
  startAt: string | Date;
  delaySeconds: number;
  hourlyLimit: number;
  senderCount?: number;
}

export interface SendPlanEstimate {
  recipientCount: number;
  firstHourCount: number;
  remainingCount: number;
  windowsCount: number;
  estimatedFinishTime: Date;
  formattedFinishTime: string;
  summarySentence: string;
  isPastStart: boolean;
}

/**
 * Calculates the estimated completion time and hourly quota distribution.
 * Models:
 * 1. Minimum interval delay between sequential sends.
 * 2. Strict clock-hour quotas (e.g. 10:00 - 10:59:59).
 * 3. Single sender model (conservative estimate).
 */
export function estimateSendPlan({
  recipientCount,
  startAt,
  delaySeconds,
  hourlyLimit,
  senderCount = 1,
}: SendPlanParams): SendPlanEstimate | null {
  if (recipientCount <= 0 || delaySeconds < 0 || hourlyLimit <= 0) {
    return null;
  }

  const startDate = new Date(startAt);
  if (isNaN(startDate.getTime())) {
    return null;
  }

  const now = new Date();
  const isPastStart = startDate.getTime() < now.getTime() - 60000; // grace period of 1 min

  // Effective starting timestamp for simulation
  const effectiveStart = isPastStart ? now : new Date(startDate.getTime());
  let simulatedTime = new Date(effectiveStart.getTime());

  let remaining = recipientCount;
  let windowsCount = 0;
  let firstHourCount = 0;

  // Effective hourly capacity factoring sender count
  const effectiveHourlyCap = hourlyLimit * Math.max(1, senderCount);

  while (remaining > 0) {
    windowsCount++;

    // Calculate time remaining in the current clock hour (until :00:00 of next hour)
    const nextClockHour = new Date(simulatedTime);
    nextClockHour.setMinutes(0, 0, 0);
    nextClockHour.setHours(nextClockHour.getHours() + 1);

    const secondsRemainingInHour = Math.max(
      0,
      Math.floor((nextClockHour.getTime() - simulatedTime.getTime()) / 1000)
    );

    // Max emails sendable in the remaining minutes of this clock hour based on delay gap
    const maxByDelay =
      delaySeconds > 0
        ? Math.floor(secondsRemainingInHour / delaySeconds) + 1
        : remaining;

    // Quota capacity for this window
    const windowQuota = Math.min(effectiveHourlyCap, maxByDelay);
    const sendsInThisWindow = Math.min(remaining, Math.max(1, windowQuota));

    if (windowsCount === 1) {
      firstHourCount = sendsInThisWindow;
    }

    // Advance time for this window's sends
    const windowDurationSeconds = Math.max(0, (sendsInThisWindow - 1) * delaySeconds);
    simulatedTime = new Date(simulatedTime.getTime() + windowDurationSeconds * 1000);

    remaining -= sendsInThisWindow;

    // If emails remain, jump to the start of the next clock hour
    if (remaining > 0) {
      simulatedTime = new Date(nextClockHour.getTime());
    }
  }

  const formattedFinishTime = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(simulatedTime);

  // Build clean summary sentence matching Figma Screen 4
  let summarySentence = '';
  if (windowsCount === 1) {
    summarySentence = `${recipientCount} emails · all send in the first hour, finishing around ${formattedFinishTime}`;
  } else {
    const rollCount = recipientCount - firstHourCount;
    summarySentence = `${recipientCount} emails · ${firstHourCount} send in the first hour, ${rollCount} roll into the next (finishing around ${formattedFinishTime})`;
  }

  return {
    recipientCount,
    firstHourCount,
    remainingCount: recipientCount - firstHourCount,
    windowsCount,
    estimatedFinishTime: simulatedTime,
    formattedFinishTime,
    summarySentence,
    isPastStart,
  };
}
