import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import WaitlistSignup from "../WaitlistSignup";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.gtag for analytics
const mockGtag = jest.fn();
Object.defineProperty(window, "gtag", {
  value: mockGtag,
  writable: true,
});

// Mock URLSearchParams for UTM parameter testing
const mockURLSearchParams = jest.fn();
Object.defineProperty(window, "URLSearchParams", {
  value: mockURLSearchParams,
  writable: true,
});

describe("WaitlistSignup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockGtag.mockClear();
    
    // Mock URLSearchParams.get method
    mockURLSearchParams.mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null),
    }));

    // Mock console.log for development analytics
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the basic form elements", () => {
      render(<WaitlistSignup />);
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expected monthly email volume/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/current email provider/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /join waitlist/i })).toBeInTheDocument();
    });

    it("renders in compact mode", () => {
      render(<WaitlistSignup compact />);
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/current email provider/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/join the waitlist/i)).not.toBeInTheDocument();
    });

    it("pre-fills estimated volume when provided", () => {
      render(<WaitlistSignup estimatedVolume={50000} />);
      
      const volumeInput = screen.getByLabelText(/expected monthly email volume/i);
      expect(volumeInput).toHaveValue(50000);
    });

    it("applies custom className", () => {
      const { container } = render(<WaitlistSignup className="custom-class" />);
      
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Form Validation", () => {
    it("shows email required error when submitting empty email", async () => {
      const user = userEvent.setup();
      render(<WaitlistSignup />);
      
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    it("shows email format error for invalid email", async () => {
      const user = userEvent.setup();
      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, "invalid-email");
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it("clears email error when valid email is entered", async () => {
      const user = userEvent.setup();
      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      
      // Enter invalid email first
      await user.type(emailInput, "invalid");
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      
      // Clear and enter valid email
      await user.clear(emailInput);
      await user.type(emailInput, "test@example.com");
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it("disables submit button when email is invalid", async () => {
      const user = userEvent.setup();
      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "invalid-email");
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with valid data", async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Successfully joined the waitlist!",
          data: {
            id: "test-id",
            email: "test@example.com",
            created_at: "2024-01-01T00:00:00Z",
          },
        }),
      });

      render(<WaitlistSignup onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const volumeInput = screen.getByLabelText(/expected monthly email volume/i);
      const providerInput = screen.getByLabelText(/current email provider/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.type(volumeInput, "50000");
      await user.type(providerInput, "Resend");
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/waitlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
            estimatedVolume: 50000,
            currentProvider: "Resend",
            referralSource: "",
          }),
          signal: expect.any(AbortSignal),
        });
      });
      
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, message: "Success" }),
        }), 100))
      );

      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);
      
      expect(screen.getByText(/joining.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it("shows success state after successful submission", async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Successfully joined the waitlist!",
          data: { id: "test-id", email: "test@example.com", created_at: "2024-01-01T00:00:00Z" },
        }),
      });

      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const volumeInput = screen.getByLabelText(/expected monthly email volume/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.type(volumeInput, "25000");
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/you're on the waitlist!/i)).toBeInTheDocument();
        expect(screen.getByText(/we'll notify you when the hosted version becomes available/i)).toBeInTheDocument();
        expect(screen.getByText(/expected volume: 25,000 emails\/month/i)).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error message when API returns error", async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: "Email already registered for waitlist",
        }),
      });

      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email already registered for waitlist/i)).toBeInTheDocument();
      });
    });

    it("shows retry button for recoverable errors", async () => {
      const user = userEvent.setup();
      
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
      });
    });

    it("handles retry functionality", async () => {
      const user = userEvent.setup();
      
      // First attempt fails
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      
      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
      
      // Click retry
      const retryButton = screen.getByRole("button", { name: /try again/i });
      await user.click(retryButton);
      
      expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument();
    });

    it("handles timeout errors", async () => {
      const user = userEvent.setup();
      
      mockFetch.mockRejectedValueOnce(new DOMException("The operation was aborted", "AbortError"));

      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
      });
    });
  });

  describe("Analytics Tracking", () => {
    beforeEach(() => {
      // Set NODE_ENV to development for console logging
      process.env.NODE_ENV = "development";
    });

    it("tracks form view on mount", () => {
      render(<WaitlistSignup trackingContext="pricing-page" />);
      
      expect(console.log).toHaveBeenCalledWith(
        "Analytics Event:",
        "waitlist_form_viewed",
        expect.objectContaining({
          context: "pricing-page",
          has_estimated_volume: false,
          compact_mode: false,
        })
      );
    });

    it("tracks email input interactions", async () => {
      const user = userEvent.setup();
      render(<WaitlistSignup trackingContext="test" />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, "test@example.com");
      
      expect(console.log).toHaveBeenCalledWith(
        "Analytics Event:",
        "waitlist_form_email_input",
        expect.objectContaining({
          context: "test",
          has_value: true,
        })
      );
    });

    it("tracks form submission attempts", async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: "Success" }),
      });

      render(<WaitlistSignup trackingContext="test" />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);
      
      expect(console.log).toHaveBeenCalledWith(
        "Analytics Event:",
        "waitlist_form_submit_clicked",
        expect.objectContaining({
          context: "test",
          has_email: true,
        })
      );
    });

    it("tracks successful submissions", async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Success",
          data: { id: "test-id", email: "test@example.com", created_at: "2024-01-01T00:00:00Z" },
        }),
      });

      render(<WaitlistSignup trackingContext="test" />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          "Analytics Event:",
          "waitlist_form_submitted_success",
          expect.objectContaining({
            context: "test",
            email_domain: "example.com",
            signup_id: "test-id",
          })
        );
      });
    });

    it("tracks submission errors", async () => {
      const user = userEvent.setup();
      
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<WaitlistSignup trackingContext="test" />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          "Analytics Event:",
          "waitlist_form_submitted_error",
          expect.objectContaining({
            context: "test",
            error_type: "unknown",
          })
        );
      });
    });
  });

  describe("UTM Parameter Capture", () => {
    it("captures UTM parameters from URL", () => {
      const mockGet = jest.fn()
        .mockReturnValueOnce("google")
        .mockReturnValueOnce("cpc")
        .mockReturnValueOnce("launch");
      
      mockURLSearchParams.mockImplementation(() => ({
        get: mockGet,
      }));

      render(<WaitlistSignup />);
      
      expect(mockGet).toHaveBeenCalledWith("utm_source");
      expect(mockGet).toHaveBeenCalledWith("utm_medium");
      expect(mockGet).toHaveBeenCalledWith("utm_campaign");
    });

    it("includes UTM parameters in form submission", async () => {
      const user = userEvent.setup();
      
      const mockGet = jest.fn()
        .mockReturnValueOnce("google")
        .mockReturnValueOnce("cpc")
        .mockReturnValueOnce("launch");
      
      mockURLSearchParams.mockImplementation(() => ({
        get: mockGet,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: "Success" }),
      });

      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole("button", { name: /join waitlist/i });
      
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/waitlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
            utmSource: "google",
            utmMedium: "cpc",
            utmCampaign: "launch",
          }),
          signal: expect.any(AbortSignal),
        });
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels and descriptions", () => {
      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute("required");
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("associates error messages with inputs", async () => {
      const user = userEvent.setup();
      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, "invalid");
      
      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
        expect(screen.getByText(/please enter a valid email address/i)).toHaveAttribute("id", "email-error");
      });
    });

    it("maintains focus management during state changes", async () => {
      const user = userEvent.setup();
      render(<WaitlistSignup />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.click(emailInput);
      
      expect(emailInput).toHaveFocus();
    });
  });
});