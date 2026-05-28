export const launchKit = {
  name: "FreeResend Self-Hosted Launch Kit",
  price: "$12",
  productUrl: "/launch-kit",
  downloadUrl: "/launch-kit/download?purchase=success",
  checkoutUrl: "https://buy.stripe.com/7sY6oJec12WP3i6afQ8so02",
  stripePaymentLinkId: "plink_1TbzL1PumRNTtKWj9H06DvKY",
  stripeProductId: "prod_UbBiFZ4xQHw97Z",
  stripePriceId: "price_1TbzKqPumRNTtKWjlaIdDWsw",
  bullets: [
    "DNS, SES, DKIM, SPF, and DMARC launch checklist",
    "Production environment and webhook rollout checks",
    "Deliverability smoke-test script outline",
    "Incident rollback and monitoring checklist",
  ],
} as const;

export const deploymentReview = {
  name: "FreeResend Deployment Review",
  price: "$12",
  productUrl: "/deployment-review",
  thanksUrl: "/deployment-review/thanks",
  checkoutUrl: "https://buy.stripe.com/5kQ8wR2tj0OHg4S5ZA8so04",
  stripePaymentLinkId: "plink_1Tc184PumRNTtKWjsEn4dgT9",
  stripeProductId: "prod_UbDZ8ngA9IVDxu",
  stripePriceId: "price_1Tc17wPumRNTtKWj3MgY7uMl",
  bullets: [
    "DNS, DKIM, SPF, and DMARC risk review",
    "SES sandbox, region, bounce, and complaint checks",
    "Webhook and smoke-test gaps to fix before launch",
    "One-page priority report delivered from your Stripe intake",
  ],
} as const;

export const sesProductionGuide = {
  name: "SES Production Readiness Guide",
  productUrl: "/guides/ses-production-readiness",
  canonicalUrl: "https://www.freeresend.com/guides/ses-production-readiness",
} as const;
