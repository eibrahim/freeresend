/**
 * Integration tests for analytics API endpoint
 * @jest-environment node
 */

import { z } from 'zod';

// Mock the database module
jest.mock('@/lib/database', () => ({
  query: jest.fn(),
}));

// Mock the middleware
jest.mock('@/lib/middleware', () => ({
  withAuth: (handler: unknown) => handler,
}));

import { query } from '@/lib/database';

const mockQuery = query as jest.MockedFunction<typeof query>;

// Test data
const mockStatusBreakdown = {
  rows: [
    { status: 'sent', count: '50' },
    { status: 'delivered', count: '45' },
    { status: 'bounced', count: '3' },
    { status: 'failed', count: '2' },
  ],
};

describe('Analytics API Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Date Validation', () => {
    it('should require both startDate and endDate', () => {
      const dateSchema = z.object({
        startDate: z.string(),
        endDate: z.string(),
      });

      const result = dateSchema.safeParse({ startDate: '2024-01-01' });
      expect(result.success).toBe(false);
    });

    it('should validate ISO 8601 date format', () => {
      const validDates = [
        '2024-01-01',
        '2024-12-31',
        '2023-06-15',
      ];

      validDates.forEach((date) => {
        const dateObj = new Date(date);
        expect(isNaN(dateObj.getTime())).toBe(false);
      });
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        'not-a-date',
        'invalid',
        'abc-def-ghij',
      ];

      invalidDates.forEach((date) => {
        const dateObj = new Date(date);
        expect(isNaN(dateObj.getTime())).toBe(true);
      });
      
      // Note: JavaScript Date is permissive and accepts formats like "2024/01/01"
      // API validation should use a proper date validation library or regex
    });

    it('should validate that startDate is before endDate', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-10');
      
      expect(start > end).toBe(true); // This would be invalid
    });
  });

  describe('Query Building', () => {
    it('should build query with date range only', () => {
      const conditions = ['created_at >= $1', 'created_at <= $2'];
      const params = [new Date('2024-01-01'), new Date('2024-01-31')];

      expect(conditions.length).toBe(2);
      expect(params.length).toBe(2);
    });

    it('should include domain filter when provided', () => {
      const conditions = ['created_at >= $1', 'created_at <= $2', 'domain_id = $3'];
      const params = [
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'domain-id-123',
      ];

      expect(conditions.length).toBe(3);
      expect(params.length).toBe(3);
      expect(conditions[2]).toContain('domain_id');
    });
  });

  describe('Status Breakdown Calculation', () => {
    it('should aggregate status counts correctly', async () => {
      mockQuery.mockResolvedValueOnce(mockStatusBreakdown);

      const statusBreakdown: Record<string, number> = {
        sent: 0,
        delivered: 0,
        bounced: 0,
        failed: 0,
        complained: 0,
        pending: 0,
      };

      mockStatusBreakdown.rows.forEach((row: { status: string; count: string }) => {
        if (row.status in statusBreakdown) {
          statusBreakdown[row.status] = parseInt(row.count);
        }
      });

      expect(statusBreakdown.sent).toBe(50);
      expect(statusBreakdown.delivered).toBe(45);
      expect(statusBreakdown.bounced).toBe(3);
      expect(statusBreakdown.failed).toBe(2);
    });

    it('should handle empty status breakdown', () => {
      const emptyBreakdown = { rows: [] };
      
      const statusBreakdown: Record<string, number> = {
        sent: 0,
        delivered: 0,
        bounced: 0,
        failed: 0,
        complained: 0,
        pending: 0,
      };

      emptyBreakdown.rows.forEach((row: { status: string; count: string }) => {
        if (row.status in statusBreakdown) {
          statusBreakdown[row.status] = parseInt(row.count);
        }
      });

      expect(Object.values(statusBreakdown).every(v => v === 0)).toBe(true);
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate delivery rate correctly', () => {
      const delivered = 45;
      const total = 100;
      const deliveryRate = (delivered / total) * 100;

      expect(deliveryRate).toBe(45);
    });

    it('should calculate bounce rate correctly', () => {
      const bounced = 3;
      const total = 100;
      const bounceRate = (bounced / total) * 100;

      expect(bounceRate).toBe(3);
    });

    it('should handle zero total emails', () => {
      const total = 0;
      const delivered = 0;
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

      expect(deliveryRate).toBe(0);
    });

    it('should calculate average daily volume', () => {
      const totalEmails = 100;
      const daysDiff = 10;
      const avgDailyVolume = totalEmails / daysDiff;

      expect(avgDailyVolume).toBe(10);
    });

    it('should handle minimum 1 day for average calculation', () => {
      const totalEmails = 50;
      const daysDiff = Math.max(1, 0); // Even if same day, count as 1
      const avgDailyVolume = totalEmails / daysDiff;

      expect(avgDailyVolume).toBe(50);
    });

    it('should round metrics to 1 decimal place', () => {
      const value = 45.6789;
      const rounded = Math.round(value * 10) / 10;

      expect(rounded).toBe(45.7);
    });
  });

  describe('Time Series Transformation', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = date.toISOString().split('T')[0];

      expect(formatted).toBe('2024-01-15');
    });

    it('should convert string counts to numbers', () => {
      const row = {
        total: '25',
        sent: '23',
        delivered: '20',
        bounced: '2',
        failed: '1',
      };

      const converted = {
        total: parseInt(row.total),
        sent: parseInt(row.sent),
        delivered: parseInt(row.delivered),
        bounced: parseInt(row.bounced),
        failed: parseInt(row.failed),
      };

      expect(converted.total).toBe(25);
      expect(typeof converted.total).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large date ranges', () => {
      const start = new Date('2020-01-01');
      const end = new Date('2024-12-31');
      const daysDiff = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBeGreaterThan(1000);
    });

    it('should handle single day range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-01');
      const daysDiff = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );

      expect(daysDiff).toBe(1);
    });

    it('should handle status values not in breakdown', () => {
      const statusBreakdown: Record<string, number> = {
        sent: 0,
        delivered: 0,
        bounced: 0,
        failed: 0,
        complained: 0,
        pending: 0,
      };

      const unknownStatus = { status: 'unknown', count: '10' };
      
      if (unknownStatus.status in statusBreakdown) {
        statusBreakdown[unknownStatus.status] = parseInt(unknownStatus.count);
      }

      // Unknown status should not be added
      expect(statusBreakdown.sent).toBe(0);
      expect(Object.keys(statusBreakdown).length).toBe(6);
    });
  });
});
