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
