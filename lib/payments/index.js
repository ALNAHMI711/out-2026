import {MockProvider} from "./mock";

const PROVIDERS = {mock: MockProvider};

export function getPaymentProvider() {
  const provider=process.env.PAYMENT_PROVIDER || (process.env.NODE_ENV === "production" ? "" : "mock");
  if (!provider) throw new Error("PAYMENT_PROVIDER must be configured in production");
  if (provider === "mock" && process.env.NODE_ENV === "production") {
    throw new Error("Mock payment provider is disabled in production");
  }
  const Provider=PROVIDERS[provider];
  if (!Provider) throw new Error("Unknown payment provider: "+provider);
  return new Provider();
}
