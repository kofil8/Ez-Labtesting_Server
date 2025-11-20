export interface CreateCheckoutSessionInput {
  priceId: string; // Stripe Price ID
  successUrl: string; // Redirect after success
  cancelUrl: string; // Redirect after cancel
}

export interface WebhookEvent {
  type: string;
  data: any;
}
