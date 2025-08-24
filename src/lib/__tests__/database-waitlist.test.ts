/**
 * Unit tests for waitlist database operations
 * @jest-environment node
 */

// Mock pg module before importing database
jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    end: jest.fn(),
  };

  return {
    Pool: jest.fn().mockImplementation(() => mockPool),
  };
});

import {
  createWaitlistSignup,
  getWaitlistSignupByEmail,
  getAllWaitlistSignups,
  getWaitlistAnalytics,
  getWaitlistSignupsCount,
  exportWaitlistSignups,
  CreateWaitlistSignupData,
  WaitlistSignup,
  WaitlistAnalytics,
  db,
} from '../database';

// Get access to the mocked pool
const mockPool = db as {
  connect: jest.MockedFunction<() => Promise<{ query: jest.MockedFunction<unknown>; release: jest.MockedFunction<unknown> }>>;
};
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

// Update the pool mock to return our mockClient
mockPool.connect = jest.fn().mockResolvedValue(mockClient);

describe('Waitlist Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockClear();
    mockClient.release.mockClear();
    mockPool.connect.mockClear();
    mockPool.connect.mockResolvedValue(mockClient);
  });

  describe('createWaitlistSignup', () => {
    it('should create a waitlist signup with all fields', async () => {
      const mockSignup: WaitlistSignup = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        estimated_volume: 10000,
        current_provider: 'resend',
        referral_source: 'google',
        user_agent: 'Mozilla/5.0',
        ip_address: '192.168.1.1',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'launch',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockSignup] });

      const data: CreateWaitlistSignupData = {
        email: 'test@example.com',
        estimated_volume: 10000,
        current_provider: 'resend',
        referral_source: 'google',
        user_agent: 'Mozilla/5.0',
        ip_address: '192.168.1.1',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'launch',
      };

      const result = await createWaitlistSignup(data);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO waitlist_signups'),
        [
          'test@example.com',
          10000,
          'resend',
          'google',
          'Mozilla/5.0',
          '192.168.1.1',
          'google',
          'cpc',
          'launch',
        ]
      );
      expect(result).toEqual(mockSignup);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should create a waitlist signup with minimal fields', async () => {
      const mockSignup: WaitlistSignup = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'minimal@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockSignup] });

      const data: CreateWaitlistSignupData = {
        email: 'minimal@example.com',
      };

      const result = await createWaitlistSignup(data);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO waitlist_signups'),
        [
          'minimal@example.com',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        ]
      );
      expect(result).toEqual(mockSignup);
    });

    it('should handle database errors', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      const data: CreateWaitlistSignupData = {
        email: 'error@example.com',
      };

      await expect(createWaitlistSignup(data)).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getWaitlistSignupByEmail', () => {
    it('should return a signup when email exists', async () => {
      const mockSignup: WaitlistSignup = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'existing@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockSignup] });

      const result = await getWaitlistSignupByEmail('existing@example.com');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM waitlist_signups WHERE email = $1',
        ['existing@example.com']
      );
      expect(result).toEqual(mockSignup);
    });

    it('should return null when email does not exist', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await getWaitlistSignupByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getAllWaitlistSignups', () => {
    it('should return paginated signups with default parameters', async () => {
      const mockSignups: WaitlistSignup[] = [
        {
          id: '1',
          email: 'user1@example.com',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        {
          id: '2',
          email: 'user2@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockClient.query.mockResolvedValueOnce({ rows: mockSignups });

      const result = await getAllWaitlistSignups();

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM waitlist_signups ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [100, 0]
      );
      expect(result).toEqual(mockSignups);
    });

    it('should return paginated signups with custom parameters', async () => {
      const mockSignups: WaitlistSignup[] = [];

      mockClient.query.mockResolvedValueOnce({ rows: mockSignups });

      const result = await getAllWaitlistSignups(50, 25);

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM waitlist_signups ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [50, 25]
      );
      expect(result).toEqual(mockSignups);
    });
  });

  describe('getWaitlistSignupsCount', () => {
    it('should return the total count of signups', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ count: '42' }] });

      const result = await getWaitlistSignupsCount();

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM waitlist_signups',
        undefined
      );
      expect(result).toBe(42);
    });

    it('should handle zero count', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const result = await getWaitlistSignupsCount();

      expect(result).toBe(0);
    });
  });

  describe('exportWaitlistSignups', () => {
    it('should return all signups ordered by creation date', async () => {
      const mockSignups: WaitlistSignup[] = [
        {
          id: '1',
          email: 'first@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          email: 'second@example.com',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockClient.query.mockResolvedValueOnce({ rows: mockSignups });

      const result = await exportWaitlistSignups();

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM waitlist_signups ORDER BY created_at ASC',
        undefined
      );
      expect(result).toEqual(mockSignups);
    });
  });

  describe('getWaitlistAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      const mockResults = [
        { rows: [{ count: '150' }] }, // total
        { rows: [{ count: '5' }] },   // today
        { rows: [{ count: '25' }] },  // week
        { rows: [{ count: '45' }] },  // month
        { rows: [{ avg_volume: '15000.5' }] }, // avg volume
        { rows: [{ source: 'google', count: '30' }, { source: 'twitter', count: '20' }] }, // referral
        { rows: [{ source: 'google', count: '25' }, { source: 'facebook', count: '15' }] }, // utm
      ];

      // Mock all the Promise.all queries
      mockClient.query
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2])
        .mockResolvedValueOnce(mockResults[3])
        .mockResolvedValueOnce(mockResults[4])
        .mockResolvedValueOnce(mockResults[5])
        .mockResolvedValueOnce(mockResults[6]);

      const result = await getWaitlistAnalytics();

      const expectedAnalytics: WaitlistAnalytics = {
        total_signups: 150,
        signups_today: 5,
        signups_this_week: 25,
        signups_this_month: 45,
        avg_estimated_volume: 15000.5,
        top_referral_sources: [
          { source: 'google', count: '30' },
          { source: 'twitter', count: '20' },
        ],
        top_utm_sources: [
          { source: 'google', count: '25' },
          { source: 'facebook', count: '15' },
        ],
      };

      expect(result).toEqual(expectedAnalytics);
      expect(mockClient.query).toHaveBeenCalledTimes(7);
    });

    it('should handle null average volume', async () => {
      const mockResults = [
        { rows: [{ count: '0' }] },
        { rows: [{ count: '0' }] },
        { rows: [{ count: '0' }] },
        { rows: [{ count: '0' }] },
        { rows: [{ avg_volume: null }] },
        { rows: [] },
        { rows: [] },
      ];

      mockClient.query
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2])
        .mockResolvedValueOnce(mockResults[3])
        .mockResolvedValueOnce(mockResults[4])
        .mockResolvedValueOnce(mockResults[5])
        .mockResolvedValueOnce(mockResults[6]);

      const result = await getWaitlistAnalytics();

      expect(result.avg_estimated_volume).toBe(0);
      expect(result.top_referral_sources).toEqual([]);
      expect(result.top_utm_sources).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should propagate database errors and release connections', async () => {
      const dbError = new Error('Connection failed');
      
      mockClient.query.mockRejectedValue(dbError);

      await expect(getWaitlistSignupByEmail('test@example.com')).rejects.toThrow('Connection failed');
      expect(mockClient.release).toHaveBeenCalled();

      await expect(getAllWaitlistSignups()).rejects.toThrow('Connection failed');
      expect(mockClient.release).toHaveBeenCalled();

      await expect(getWaitlistSignupsCount()).rejects.toThrow('Connection failed');
      expect(mockClient.release).toHaveBeenCalled();

      await expect(exportWaitlistSignups()).rejects.toThrow('Connection failed');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Data validation', () => {
    it('should handle various data types correctly', async () => {
      const mockSignup: WaitlistSignup = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        estimated_volume: 0, // Edge case: zero volume
        current_provider: '', // Edge case: empty string
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockSignup] });

      const data: CreateWaitlistSignupData = {
        email: 'test@example.com',
        estimated_volume: 0,
        current_provider: '',
      };

      const result = await createWaitlistSignup(data);

      expect(result.estimated_volume).toBe(0);
      expect(result.current_provider).toBe('');
    });
  });
});