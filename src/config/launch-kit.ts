export const launchKit = {
  name: "FreeResend Self-Hosted Launch Kit",
  price: "$12",
  productUrl: "/launch-kit",
  downloadUrl: "/launch-kit/download?purchase=success",
  checkoutUrl: "https://buy.stripe.com/4gMeVc3bdaJ20y7crTaMU00",
  stripePaymentLinkId: "plink_1Tc62wD3ywlDS5H4VdsU3VtA",
  stripeProductId: "prod_UbIethmI5TD7vH",
  stripePriceId: "price_1Tc62vD3ywlDS5H46Leeh9If",
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
  checkoutUrl: "https://buy.stripe.com/3cIcN49zBcRagx5dvXaMU01",
  stripePaymentLinkId: "plink_1Tc62yD3ywlDS5H4ThYUyf51",
  stripeProductId: "prod_UbIeNQ3VLjvNNw",
  stripePriceId: "price_1Tc62xD3ywlDS5H4MsYe9nM6",
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
