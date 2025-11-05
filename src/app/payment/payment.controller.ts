import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Res,
  Headers,
  RawBodyRequest,
  Logger,
} from "@nestjs/common";
import { Response as ExpressResponse } from "express";
import { PaymentService } from "./payment.service";
import { ResponseService } from "src/common/response.service";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { CreatePaymentDto, CreateCheckoutDto } from "./dto";
import Stripe from "stripe";

@Controller("/payment")
@ApiTags("Payment")
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly responseService: ResponseService
  ) {}

  @Post("/process")
  @ApiOperation({ summary: "Process payment with card details" })
  @ApiBody({ type: CreatePaymentDto })
  async processPayment(
    @Req() req,
    @Res() res: ExpressResponse,
    @Body() body: CreatePaymentDto
  ) {
    try {
      const { amount, cardNumber, expMonth, expYear, cvc, currency = "aed" } = body;

      const paymentResult = await this.paymentService.processPayment(
        amount,
        cardNumber,
        expMonth,
        expYear,
        cvc,
        currency
      );

      // Convert amount back from smallest unit
      // Zero-decimal currencies (AED, JPY, etc.) don't need division
      const zeroDecimalCurrencies = ['jpy', 'clp', 'ugx', 'xaf', 'xof', 'krw', 'mga', 'pyg', 'rwf', 'vnd', 'vuv', 'xpf', 'aed'];
      const currencyCode = paymentResult.paymentIntent.currency.toLowerCase();
      const displayAmount = zeroDecimalCurrencies.includes(currencyCode) 
        ? paymentResult.paymentIntent.amount 
        : paymentResult.paymentIntent.amount / 100;

      const responseData = {
        paymentIntentId: paymentResult.paymentIntent.id,
        status: paymentResult.paymentIntent.status,
        amount: displayAmount,
        currency: paymentResult.paymentIntent.currency.toUpperCase(),
        clientSecret: paymentResult.clientSecret,
        paymentMethodId: paymentResult.paymentIntent.payment_method || undefined,
      };

      this.responseService.success(res, "PAYMENT_SUCCESS", responseData);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/checkout")
  @ApiOperation({ summary: "Create Stripe Checkout Session - Returns payment link" })
  @ApiBody({ type: CreateCheckoutDto })
  async createCheckout(
    @Req() req,
    @Res() res: ExpressResponse,
    @Body() body: CreateCheckoutDto
  ) {
    try {
      const { amount, currency = "aed", successUrl, cancelUrl } = body;

      const checkoutResult = await this.paymentService.createCheckoutSession(
        amount,
        currency,
        successUrl,
        cancelUrl
      );

      const responseData = {
        checkoutUrl: checkoutResult.checkoutUrl,
        sessionId: checkoutResult.sessionId,
        amount: amount,
        currency: currency.toUpperCase(),
        message: "Click on checkoutUrl to open Stripe payment page",
      };

      this.responseService.success(res, "CHECKOUT_CREATED", responseData);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/webhook")
  @ApiOperation({ summary: "Stripe webhook endpoint for payment events" })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: ExpressResponse,
    @Headers('stripe-signature') signature?: string
  ) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      
      let event: Stripe.Event;
      
      if (webhookSecret && signature) {
        // Verify webhook signature
        try {
          const rawBody = req.rawBody as Buffer;
          event = this.paymentService.stripe.webhooks.constructEvent(
            rawBody,
            signature,
            webhookSecret
          ) as Stripe.Event;
        } catch (err: any) {
          this.logger.error('Webhook signature verification failed:', err?.message || 'Unknown error');
          return res.status(400).send(`Webhook Error: ${err?.message || 'Signature verification failed'}`);
        }
      } else {
        // In development, parse JSON body directly
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          event = body as Stripe.Event;
        } catch (parseError: any) {
          this.logger.error('Failed to parse webhook body:', parseError?.message);
          return res.status(400).send(`Webhook Error: Failed to parse body`);
        }
      }

      // Handle the event
      await this.paymentService.handleWebhookEvent(event);

      return res.status(200).json({ received: true });
    } catch (error: any) {
      this.logger.error("Webhook error:", error);
      return res.status(400).send(`Webhook Error: ${error?.message || 'Unknown error'}`);
    }
  }

  @Get("/success")
  @ApiOperation({ summary: "Check payment status after successful checkout" })
  async checkPaymentStatus(
    @Req() req,
    @Res() res: ExpressResponse
  ) {
    try {
      const sessionId = req.query.session_id as string;
      
      if (!sessionId) {
        return this.responseService.error(req, res, "Session ID is required", 400);
      }

      // Retrieve session from Stripe to get payment details
      const session = await this.paymentService.stripe.checkout.sessions.retrieve(sessionId);

      // Update payment status in database
      if (session.payment_status === 'paid') {
        await this.paymentService.updatePaymentStatus(
          sessionId,
          'Request Submitted'
        );
      }

      // Convert amount back from smallest unit
      const zeroDecimalCurrencies = ['jpy', 'clp', 'ugx', 'xaf', 'xof', 'krw', 'mga', 'pyg', 'rwf', 'vnd', 'vuv', 'xpf', 'aed'];
      const currencyCode = (session.currency || 'aed').toLowerCase();
      const displayAmount = zeroDecimalCurrencies.includes(currencyCode)
        ? (session.amount_total || 0)
        : (session.amount_total || 0) / 100;

      const responseData = {
        sessionId: session.id,
        paymentStatus: session.payment_status,
        paymentIntentId: session.payment_intent,
        amount: displayAmount,
        currency: session.currency?.toUpperCase(),
        customerEmail: session.customer_email,
      };

      this.responseService.success(res, "PAYMENT_STATUS", responseData);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }
}

