import prisma from "../../config/db";
import { stripe } from "../../config/stripe";
import { CreateCheckoutSessionInput } from "./payment.types";

class PaymentService {
  async createCustomer(userId: string, email: string) {
    const existing = await prisma.billing.findUnique({ where: { userId } });
    if (existing) return existing;

    const customer = await stripe.customers.create({ email });
    const billing = await prisma.billing.create({
      data: { userId, stripeCustomerId: customer.id },
    });
    return billing;
  }

  async createCheckoutSession(
    userId: string,
    input: CreateCheckoutSessionInput
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const billing = await this.createCustomer(user.id, user.email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: billing.stripeCustomerId,
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    return { sessionUrl: session.url };
  }

  async handleWebhook(eventType: string, data: any) {
    switch (eventType) {
      case "checkout.session.completed":
        await prisma.payment.create({
          data: {
            stripeId: data.id,
            userId: data.client_reference_id,
            amount: data.amount_total / 100,
            status: "success",
          },
        });
        break;

      case "invoice.payment_failed":
        await prisma.payment.create({
          data: {
            stripeId: data.id,
            userId: data.customer,
            amount: data.amount_due / 100,
            status: "failed",
          },
        });
        break;

      case "customer.subscription.deleted":
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: data.id },
          data: { status: "canceled" },
        });
        break;

      default:
        console.log("Unhandled event type:", eventType);
    }
  }

  async getPaymentHistory(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export default new PaymentService();
