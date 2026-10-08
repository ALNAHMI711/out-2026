export class MockProvider {
  async createCheckoutSession(order) {
    if (!order?.id || !order?.order_number || !Number.isInteger(order?.total_cents)) {
      throw new Error("Invalid order");
    }
    return {
      sessionId: "test_"+order.id,
      url: "/checkout?order="+encodeURIComponent(order.order_number),
      expiresAt: new Date(Date.now()+30*60*1000).toISOString(),
    };
  }

  verifyWebhook() {
    throw new Error("Mock webhook verification is test-only");
  }

  async refund(paymentId, amountCents) {
    if (!paymentId || !Number.isInteger(amountCents) || amountCents <= 0) {
      throw new Error("Invalid refund");
    }
    return {success:true,testOnly:true,paymentId,amountCents};
  }
}
