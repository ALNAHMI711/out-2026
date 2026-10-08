import {PaymentProviderInterface} from "./types";

export class StripeProvider {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY missing");
    }
  }

  async createCheckoutSession() {
    throw new Error("StripeProvider not yet implemented");
  }

  verifyWebhook() {
    throw new Error("StripeProvider not yet implemented");
  }

  async refund() {
    throw new Error("StripeProvider not yet implemented");
  }
}

void PaymentProviderInterface;
