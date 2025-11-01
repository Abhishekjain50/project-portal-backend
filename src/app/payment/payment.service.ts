import { Injectable, Logger, BadRequestException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import Stripe from "stripe";
import * as dotenv from "dotenv";
import { Payment } from "src/entities/payment.entity";

dotenv.config();

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  public readonly stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @Inject(DataSource)
    private dataSource: DataSource,
  ) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not defined");
    }

    this.stripe = new Stripe(secretKey);
  }

  private getCurrencyMinimum(currency: string): number {
    const minimums: { [key: string]: number } = {
      'aed': 2,
      'usd': 0.50,
      'eur': 0.50,
      'gbp': 0.30,
      'jpy': 50,
      'cad': 0.50,
      'aud': 0.50,
    };
    
    return minimums[currency.toLowerCase()] || 0.01;
  }

  private getAmountInSmallestUnit(amount: number, currency: string): number {
    const zeroDecimalCurrencies = ['jpy', 'clp', 'ugx', 'xaf', 'xof', 'krw', 'mga', 'pyg', 'rwf', 'vnd', 'vuv', 'xpf', 'aed'];
    
    if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
      return Math.round(amount);
    }
    
    return Math.round(amount * 100);
  }

  async createPaymentIntent(amount: number, currency: string = "aed"): Promise<Stripe.PaymentIntent> {
    try {
      const amountInSmallestUnit = this.getAmountInSmallestUnit(amount, currency);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      this.logger.error("Error creating payment intent:", error);
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  async createPaymentMethod(
    cardNumber: string,
    expMonth: string,
    expYear: string,
    cvc: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: "card",
        card: {
          number: cardNumber.replace(/\s/g, ""),
          exp_month: parseInt(expMonth),
          exp_year: parseInt(expYear),
          cvc: cvc,
        },
      });

      return paymentMethod;
    } catch (error) {
      this.logger.error("Error creating payment method:", error);
      throw new BadRequestException(`Failed to create payment method: ${error.message}`);
    }
  }

  async processPayment(
    amount: number,
    cardNumber: string,
    expMonth: string,
    expYear: string,
    cvc: string,
    currency: string = "aed"
  ): Promise<{
    paymentIntent: Stripe.PaymentIntent;
    clientSecret?: string;
  }> {
    try {
      // Validate minimum amount for currency
      const minimumAmount = this.getCurrencyMinimum(currency);
      if (amount < minimumAmount) {
        throw new BadRequestException(
          `Amount must be at least ${minimumAmount} ${currency.toUpperCase()}`
        );
      }

      const amountInSmallestUnit = this.getAmountInSmallestUnit(amount, currency);

      // Use payment_method_data to pass card details directly in PaymentIntent
      // This avoids the need to create a PaymentMethod separately
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        payment_method_data: {
          type: "card",
          card: {
            number: cardNumber.replace(/\s/g, ""),
            exp_month: parseInt(expMonth),
            exp_year: parseInt(expYear),
            cvc: cvc,
          },
        } as any,
        confirm: true,
        return_url: "https://www.google.com/return",
      });

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error) {
      this.logger.error("Error processing payment:", error);

      // Check if it's the raw card data restriction error
      if (error.message && error.message.includes("raw card data")) {
        throw new BadRequestException(
          "Raw card data APIs are not enabled. Please enable 'Raw card data APIs' in your Stripe Dashboard under Settings > APIs, or contact Stripe support. " +
          "Alternatively, use Stripe.js on the frontend to securely collect card details and send a payment method ID instead."
        );
      }

      if (error instanceof Stripe.errors.StripeCardError) {
        throw new BadRequestException(`Payment failed: ${error.message}`);
      }
      
      const errorMessage = error instanceof Error ? error.message : "Payment processing failed";
      throw new BadRequestException(`Payment processing failed: ${errorMessage}`);
    }
  }

  async createCheckoutSession(
    amount: number,
    currency: string = "aed",
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{
    checkoutUrl: string;
    sessionId: string;
  }> {
    try {
      // Validate minimum amount for currency (use original amount, not multiplied)
      const minimumAmount = this.getCurrencyMinimum(currency);
      if (amount < minimumAmount) {
        throw new BadRequestException(
          `Amount must be at least ${minimumAmount} ${currency.toUpperCase()}`
        );
      }

      const amountInSmallestUnit = this.getAmountInSmallestUnit(amount, currency);

      // Default URLs if not provided
      const defaultSuccessUrl = successUrl || `${process.env.BASE_URL || 'http://localhost:4000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
      const defaultCancelUrl = cancelUrl || `${process.env.BASE_URL || 'http://localhost:4000'}/payment/cancel`;

      // Create Stripe Checkout Session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'Payment',
                description: `Payment of ${amount} ${currency.toUpperCase()}`,
              },
              unit_amount: amountInSmallestUnit,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: defaultSuccessUrl,
        cancel_url: defaultCancelUrl,
        currency: currency.toLowerCase(),
      });

      // Payment record will be saved in application entity, not here
      this.logger.log(`Checkout session created with session ID: ${session.id}`);

      return {
        checkoutUrl: session.url || '',
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error("Error creating checkout session:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session";
      throw new BadRequestException(`Checkout session creation failed: ${errorMessage}`);
    }
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update application entity with payment status
        const applicationRepository = this.dataSource.getRepository("application");
        const application = await applicationRepository.findOne({
          where: { stripe_session_id: session.id },
        });

        if (application) {
          await applicationRepository.update(
            { stripe_session_id: session.id },
            { status: 'success' }
          );
          this.logger.log(`Payment succeeded for application with session ID: ${session.id}`);
        } else {
          this.logger.warn(`Application not found for session ID: ${session.id}`);
        }
      } else if (event.type === 'checkout.session.async_payment_failed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const applicationRepository = this.dataSource.getRepository("application");
        const application = await applicationRepository.findOne({
          where: { stripe_session_id: session.id },
        });

        if (application) {
          await applicationRepository.update(
            { stripe_session_id: session.id },
            { status: 'failed' }
          );
          this.logger.log(`Payment failed for application with session ID: ${session.id}`);
        }
      }
    } catch (error) {
      this.logger.error("Error handling webhook event:", error);
      throw error;
    }
  }

  async updatePaymentStatus(
    sessionId: string,
    status: string
  ): Promise<any> {
    try {
      const applicationRepository = this.dataSource.getRepository("application");
      const application = await applicationRepository.findOne({
        where: { stripe_session_id: sessionId },
      });

      if (application) {
        await applicationRepository.update(
          { stripe_session_id: sessionId },
          { status: status }
        );
        return await applicationRepository.findOne({
          where: { stripe_session_id: sessionId },
        });
      }

      return null;
    } catch (error) {
      this.logger.error("Error updating payment status:", error);
      return null;
    }
  }
}

