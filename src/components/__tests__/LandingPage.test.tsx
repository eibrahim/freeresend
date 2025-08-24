import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingPage from '../LandingPage';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('LandingPage', () => {

  it('renders pricing discovery elements in hero section', () => {
    render(<LandingPage />);
    
    // Check for "See Pricing" button in hero
    expect(screen.getByRole('link', { name: /see pricing/i })).toBeInTheDocument();
    
    // Check for hosted version teaser
    expect(screen.getByText(/hosted version coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/50-85% savings/i)).toBeInTheDocument();
    expect(screen.getByText(/fully managed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/api compatible/i)).toHaveLength(2); // One in hero, one in benefits
  });

  it('renders enhanced benefits section with pricing focus', () => {
    render(<LandingPage />);
    
    // Check for cost savings calculator preview
    expect(screen.getByText(/quick example:/i)).toBeInTheDocument();
    expect(screen.getByText(/100k emails\/month/i)).toBeInTheDocument();
    
    // Check for hosted version messaging in benefits
    expect(screen.getByText(/hosted version:/i)).toBeInTheDocument();
    expect(screen.getByText(/even faster:/i)).toBeInTheDocument();
    
    // Check for multiple "Calculate your savings" links
    const savingsLinks = screen.getAllByText(/calculate your savings/i);
    expect(savingsLinks.length).toBeGreaterThan(0);
  });

  it('has proper navigation links to pricing page', () => {
    render(<LandingPage />);
    
    // Check that pricing links point to /pricing
    const pricingLinks = screen.getAllByRole('link', { name: /pricing/i });
    pricingLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/pricing');
    });
  });

  it('has correct CTA flow directing to waitlist', () => {
    render(<LandingPage />);
    
    // Check that main CTAs direct to waitlist/pricing
    const joinWaitlistLinks = screen.getAllByRole('link', { name: /join waitlist$/i });
    expect(joinWaitlistLinks).toHaveLength(2); // One in header, one in hero
    joinWaitlistLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/pricing');
    });
    
    expect(screen.getByRole('link', { name: /join waitlist today/i })).toHaveAttribute('href', '/pricing');
    
    // Check that login is available but secondary
    expect(screen.getAllByRole('link', { name: /login/i })).toHaveLength(2); // One in header, one in hero
    
    // Check existing functionality
    expect(screen.getByText(/alternative to resend/i)).toBeInTheDocument();
    expect(screen.getByText(/100% api compatible/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view on github/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view documentation/i })).toBeInTheDocument();
  });
});