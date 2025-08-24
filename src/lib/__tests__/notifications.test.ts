import { sendWaitlistNotification, sendWelcomeEmail } from '../notifications';
import { sendEmail } from '../ses';

// Mock the SES module
jest.mock('../ses', () => ({
  sendEmail: jest.fn(),
}));

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

describe('Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variables
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.FROM_EMAIL = 'info@freeresend.com';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.FROM_EMAIL;
    delete process.env.NEXTAUTH_URL;
  });

  describe('sendWaitlistNotification', () => {
    const mockNotificationData = {
      email: 'user@example.com',
      estimatedVolume: 50000,
      currentProvider: 'Resend',
      referralSource: 'Google',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'launch',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      signupId: 'test-signup-id-123',
      createdAt: '2024-01-01T00:00:00Z',
    };

    it('sends admin notification email with correct data', async () => {
      mockSendEmail.mockResolvedValueOnce('message-id-123');

      await sendWaitlistNotification(mockNotificationData);

      expect(mockSendEmail).toHaveBeenCalledWith({
        from: 'FreeResend Notifications <info@freeresend.com>',
        to: ['admin@test.com'],
        subject: '🚀 New Waitlist Signup: user@example.com',
        html: expect.stringContaining('user@example.com'),
        text: expect.stringContaining('user@example.com'),
        tags: {
          type: 'waitlist_notification',
          signup_id: 'test-signup-id-123',
        },
      });
    });

    it('includes estimated volume in notification', async () => {
      mockSendEmail.mockResolvedValueOnce('message-id-123');

      await sendWaitlistNotification(mockNotificationData);

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('50,000 emails/month');
      expect(emailCall.text).toContain('50,000 emails/month');
    });

    it('includes UTM parameters in notification', async () => {
      mockSendEmail.mockResolvedValueOnce('message-id-123');

      await sendWaitlistNotification(mockNotificationData);

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Source: google');
      expect(emailCall.html).toContain('Medium: cpc');
      expect(emailCall.html).toContain('Campaign: launch');
    });

    it('handles missing optional fields gracefully', async () => {
      mockSendEmail.mockResolvedValueOnce('message-id-123');

      const minimalData = {
        email: 'user@example.com',
        signupId: 'test-signup-id-123',
        createdAt: '2024-01-01T00:00:00Z',
      };

      await sendWaitlistNotification(minimalData);

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Not specified');
      expect(emailCall.text).toContain('Not specified');
    });

    it('skips notification when ADMIN_EMAIL is not configured', async () => {
      delete process.env.ADMIN_EMAIL;

      await sendWaitlistNotification(mockNotificationData);

      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('does not throw error when email sending fails', async () => {
      mockSendEmail.mockRejectedValueOnce(new Error('SES error'));

      await expect(sendWaitlistNotification(mockNotificationData)).resolves.not.toThrow();
    });

    it('uses default FROM_EMAIL when not configured', async () => {
      delete process.env.FROM_EMAIL;
      mockSendEmail.mockResolvedValueOnce('message-id-123');

      await sendWaitlistNotification(mockNotificationData);

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.from).toBe('FreeResend Notifications <info@freeresend.com>');
    });

    it('uses configured FROM_EMAIL when available', async () => {
      process.env.FROM_EMAIL = 'custom@example.com';
      mockSendEmail.mockResolvedValueOnce('message-id-123');

      await sendWaitlistNotification(mockNotificationData);

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.from).toBe('FreeResend Notifications <custom@example.com>');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('sends welcome email to user', async () => {
      mockSendEmail.mockResolvedValueOnce('message-id-456');

      await sendWelcomeEmail('user@example.com', 'signup-id-456');

      expect(mockSendEmail).toHaveBeenCalledWith({
        from: 'FreeResend <info@freeresend.com>',
        to: ['user@example.com'],
        subject: 'Welcome to the FreeResend Waitlist! 🚀',
        html: expect.stringContaining('You\'re on the waitlist!'),
        text: expect.stringContaining('You\'re on the FreeResend waitlist!'),
        tags: {
          type: 'waitlist_welcome',
          signup_id: 'signup-id-456',
        },
      });
    });

    it('includes signup ID in welcome email', async () => {
      mockSendEmail.mockResolvedValueOnce('message-id-456');

      await sendWelcomeEmail('user@example.com', 'signup-id-456');

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('signup-id-456');
      expect(emailCall.text).toContain('signup-id-456');
    });

    it('does not throw error when email sending fails', async () => {
      mockSendEmail.mockRejectedValueOnce(new Error('SES error'));

      await expect(sendWelcomeEmail('user@example.com', 'signup-id-456')).resolves.not.toThrow();
    });

    it('uses FROM_EMAIL for welcome emails', async () => {
      process.env.FROM_EMAIL = 'welcome@example.com';
      mockSendEmail.mockResolvedValueOnce('message-id-456');

      await sendWelcomeEmail('user@example.com', 'signup-id-456');

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.from).toBe('FreeResend <welcome@example.com>');
    });
  });

  describe('Email content formatting', () => {
    it('formats volume numbers correctly', async () => {
      mockSendEmail.mockResolvedValueOnce('message-id-123');

      await sendWaitlistNotification({
        email: 'user@example.com',
        estimatedVolume: 1000000, // 1 million
        signupId: 'test-id',
        createdAt: '2024-01-01T00:00:00Z',
      });

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('1,000,000 emails/month');
    });

    it('handles zero volume', async () => {
      mockSendEmail.mockResolvedValueOnce('message-id-123');

      await sendWaitlistNotification({
        email: 'user@example.com',
        estimatedVolume: 0,
        signupId: 'test-id',
        createdAt: '2024-01-01T00:00:00Z',
      });

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('0 emails/month');
    });
  });
});