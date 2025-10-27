const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  constructor() {
    this.stripe = stripe;
  }

  // Create payment intent for donation
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          ...metadata,
          platform: 'veridax'
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Confirm payment intent
  async confirmPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntent,
          status: 'succeeded'
        };
      } else if (paymentIntent.status === 'requires_action') {
        return {
          success: true,
          paymentIntent,
          status: 'requires_action'
        };
      } else {
        return {
          success: false,
          error: `Payment failed with status: ${paymentIntent.status}`
        };
      }
    } catch (error) {
      console.error('Stripe payment confirmation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create refund
  async createRefund(chargeId, amount, reason = 'requested_by_customer') {
    try {
      const refund = await this.stripe.refunds.create({
        charge: chargeId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: reason
      });

      return {
        success: true,
        refund
      };
    } catch (error) {
      console.error('Stripe refund creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment intent details
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        paymentIntent
      };
    } catch (error) {
      console.error('Stripe payment intent retrieval error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create customer for recurring donations
  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          ...metadata,
          platform: 'veridax'
        }
      });

      return {
        success: true,
        customer
      };
    } catch (error) {
      console.error('Stripe customer creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create setup intent for saving payment methods
  async createSetupIntent(customerId, metadata = {}) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        metadata: {
          ...metadata,
          platform: 'veridax'
        }
      });

      return {
        success: true,
        setupIntent
      };
    } catch (error) {
      console.error('Stripe setup intent creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate webhook signature
  validateWebhookSignature(payload, signature, secret) {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, secret);
      return {
        success: true,
        event
      };
    } catch (error) {
      console.error('Stripe webhook validation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PaymentService();
