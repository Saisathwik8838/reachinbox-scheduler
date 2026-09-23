import { describe, it, expect } from 'vitest';
import { estimateSendPlan } from './sendPlanEstimator';

describe('sendPlanEstimator', () => {
  it('returns null for empty or invalid inputs', () => {
    expect(
      estimateSendPlan({
        recipientCount: 0,
        startAt: new Date().toISOString(),
        delaySeconds: 5,
        hourlyLimit: 100,
      })
    ).toBeNull();

    expect(
      estimateSendPlan({
        recipientCount: 10,
        startAt: 'invalid-date',
        delaySeconds: 5,
        hourlyLimit: 100,
      })
    ).toBeNull();

    expect(
      estimateSendPlan({
        recipientCount: 10,
        startAt: new Date().toISOString(),
        delaySeconds: -1,
        hourlyLimit: 100,
      })
    ).toBeNull();
  });

  it('calculates single window batch when under hourly limit', () => {
    const start = new Date('2026-09-24T10:00:00Z');
    const result = estimateSendPlan({
      recipientCount: 20,
      startAt: start,
      delaySeconds: 5,
      hourlyLimit: 100,
    });

    expect(result).not.toBeNull();
    expect(result?.windowsCount).toBe(1);
    expect(result?.firstHourCount).toBe(20);
    expect(result?.remainingCount).toBe(0);
    expect(result?.summarySentence).toContain('all send in the first hour');
  });

  it('correctly models 127 emails with 100/hr limit matching Figma Screen 4', () => {
    const start = new Date('2026-09-24T10:30:00Z');
    const result = estimateSendPlan({
      recipientCount: 127,
      startAt: start,
      delaySeconds: 5,
      hourlyLimit: 100,
    });

    expect(result).not.toBeNull();
    expect(result?.recipientCount).toBe(127);
    expect(result?.windowsCount).toBe(2);
    expect(result?.firstHourCount).toBe(100);
    expect(result?.remainingCount).toBe(27);
    expect(result?.summarySentence).toContain('100 send in the first hour');
    expect(result?.summarySentence).toContain('27 roll into the next');
  });

  it('spans multiple hourly windows for large batches', () => {
    const start = new Date('2026-09-24T09:00:00Z');
    const result = estimateSendPlan({
      recipientCount: 250,
      startAt: start,
      delaySeconds: 5,
      hourlyLimit: 100,
    });

    expect(result).not.toBeNull();
    expect(result?.windowsCount).toBe(3); // 100 in hr1, 100 in hr2, 50 in hr3
  });

  it('identifies when scheduled time is in the past', () => {
    const pastTime = new Date(Date.now() - 3600000); // 1 hour ago
    const result = estimateSendPlan({
      recipientCount: 50,
      startAt: pastTime,
      delaySeconds: 5,
      hourlyLimit: 100,
    });

    expect(result).not.toBeNull();
    expect(result?.isPastStart).toBe(true);
  });
});
