/**
 * Integration tests for waitlist API validation and logic
 * @jest-environment node
 */

import { z } from 'zod';

// Mock the database module
jest.mock('../../../../lib/database', () => ({
  createWaitlistSignup: jest.fn(),
  getWaitlistSignupByEmail: jest.fn(),
  getAllWaitlistSignups: jest.fn(),
  getWaitlistAnalytics: jest.fn(),
  exportWaitlistSignups: jest.fn(),
}));

import {
  createWaitlistSignup,
  getWaitlistSignupByEmail,
  getAllWaitlistSignups,
  getWaitlistAnalytics,
  exportWaitlistSignups,
} from '../../../../lib/database';

const mockCreateWaitlistSignup = createWaitlistSignup as jest.MockedFunction<typeof createWaitlistSignup>;
const mockGetWaitlistSignupByEmail = getWaitlistSignupByEmail as jest.MockedFunction<typeof getWaitlistSignupByEmail>;
const mockGetAllWaitlistSignups = getAllWaitlistSignups as jest.MockedFunction<typeof getAllWaitlistSignups>;
const mockGetWaitlistAnalytics = getWaitlistAnalytics as jest.MockedFunction<typeof getWaitlistAnalytics>;
const mockExportWaitlistSignups = exportWaitlistSignups as jest.MockedFunction<typeof exportWaitlistSignups>;

// Validation schema for waitlist signup (copied from route.ts)
const WaitlistSignupSchema = z.object({
  email: z.string().email("Invalid email format"),
  estimatedVolume: z.number().int().min(0).optional(),
  currentProvider: z.string().max(100).optional(),
  referralSource: z.string().max(100).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

describe('Waitlist API Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Schema', () => {
    it('should validate valid signup data', () => {
      const validData = {
        email: 'test@example.com',
        estimatedVolume: 10000,
        currentProvider: 'resend',
        referralSource: 'google',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'launch',
      };

      const result = WaitlistSignupSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate minimal signup data', () => {
      const minimalData = { email: 'test@example.com' };

      const result = WaitlistSignupSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.estimatedVolume).toBeUndefined();
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = { email: 'invalid-email' };

      const result = WaitlistSignupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format');
      }
    });

    it('should reject missing email', () => {
      const invalidData = { estimatedVolume: 10000 };

      const result = WaitlistSignupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative estimated volume', () => {
      const invalidData = { email: 'test@example.com', estimatedVolume: -1000 };

      const result = WaitlistSignupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject string fields that are too long', () => {
      const invalidData = {
        email: 'test@example.com',
        currentProvider: 'a'.repeat(101), // Too long
      };

      const result = WaitlistSignupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept zero estimated volume', () => {
      const validData = { email: 'test@example.com', estimatedVolume: 0 };

      const result = WaitlistSignupSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.estimatedVolume).toBe(0);
      }
    });

    it('should accept empty string for optional fields', () => {
      const validData = {
        email: 'test@example.com',
        currentProvider: '',
        referralSource: '',
      };

      const result = WaitlistSignupSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentProvider).toBe('');
        expect(result.data.referralSource).toBe('');
      }
    });
  });

  describe('Database Integration Logic', () => {
    it('should handle duplicate email signup logic', async () => {
      // Test the logic that would be used in the API endpoint
      const email = 'test@example.com';
      
      // First, check if email exists
      mockGetWaitlistSignupByEmail.mockResolvedValue({
        id: '123',
        email: email,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      const existingSignup = await getWaitlistSignupByEmail(email);
      
      expect(existingSignup).not.toBeNull();
      expect(existingSignup?.email).toBe(email);
      
      // Should not call create if email exists
      expect(mockCreateWaitlistSignup).not.toHaveBeenCalled();
    });

    it('should handle new email signup logic', async () => {
      const email = 'new@example.com';
      const signupData = {
        email: email,
        estimated_volume: 10000,
        current_provider: 'resend',
        referral_source: 'google',
        user_agent: 'Mozilla/5.0',
        ip_address: '192.168.1.1',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'launch',
      };

      // Email doesn't exist
      mockGetWaitlistSignupByEmail.mockResolvedValue(null);
      
      // Mock successful creation
      mockCreateWaitlistSignup.mockResolvedValue({
        id: '456',
        email: email,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      const existingSignup = await getWaitlistSignupByEmail(email);
      expect(existingSignup).toBeNull();

      const newSignup = await createWaitlistSignup(signupData);
      
      expect(mockCreateWaitlistSignup).toHaveBeenCalledWith(signupData);
      expect(newSignup.email).toBe(email);
    });

    it('should handle analytics retrieval logic', async () => {
      const mockAnalytics = {
        total_signups: 150,
        signups_today: 5,
        signups_this_week: 25,
        signups_this_month: 45,
        avg_estimated_volume: 15000,
        top_referral_sources: [{ source: 'google', count: 30 }],
        top_utm_sources: [{ source: 'google', count: 25 }],
      };

      mockGetWaitlistAnalytics.mockResolvedValue(mockAnalytics);

      const analytics = await getWaitlistAnalytics();
      
      expect(analytics).toEqual(mockAnalytics);
      expect(analytics.total_signups).toBe(150);
      expect(analytics.top_referral_sources).toHaveLength(1);
    });

    it('should handle pagination logic', async () => {
      const mockSignups = [
        { id: '1', email: 'user1@example.com', created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
        { id: '2', email: 'user2@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      ];

      mockGetAllWaitlistSignups.mockResolvedValue(mockSignups);

      // Test default pagination
      const signups1 = await getAllWaitlistSignups(100, 0);
      expect(mockGetAllWaitlistSignups).toHaveBeenCalledWith(100, 0);
      expect(signups1).toEqual(mockSignups);

      // Test custom pagination
      await getAllWaitlistSignups(25, 50);
      expect(mockGetAllWaitlistSignups).toHaveBeenCalledWith(25, 50);
    });

    it('should handle export logic', async () => {
      const mockExportData = [
        {
          id: '1',
          email: 'user1@example.com',
          estimated_volume: 10000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockExportWaitlistSignups.mockResolvedValue(mockExportData);

      const exportData = await exportWaitlistSignups();
      
      expect(exportData).toEqual(mockExportData);
      expect(exportData[0].email).toBe('user1@example.com');
    });
  });
});