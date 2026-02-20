import Stripe from "stripe";
import Order from "../models/order.js";
import Cart from "../models/cart.js";

// Lazy getter — only instantiated when an endpoint is called,
// so a missing STRIPE_SECRET_KEY won't crash the server on startup.
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/payment/create-checkout-session
// Creates a Stripe Checkout session from the user's current cart
export const createCheckoutSession = async (req, res) => {
  try {
    const { address } = req.body;

    // 1. Fetch the user's cart
    const cart = await Cart.findOne({ userId: req.user._id }).populate(
      "items.foodId",
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        status: "fail",
        data: null,
        message: "Cart is empty",
      });
    }

    // 2. Build Stripe line items from cart
    const lineItems = cart.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.foodId?.name || "Food Item",
          description: item.foodId?.description || "",
        },
        // Stripe expects amount in smallest currency unit (paise for INR)
        unit_amount: Math.round(item.priceSnapshot * 100),
      },
      quantity: item.quantity,
    }));

    // 3. Calculate total for order record
    const totalAmount = cart.items.reduce(
      (sum, i) => sum + i.priceSnapshot * i.quantity,
      0,
    );

    // 4. Create the order first (status: pending, paymentStatus: unpaid)
    const order = await Order.create({
      userId: req.user._id,
      items: cart.items,
      totalAmount,
      address: address || "",
      paymentMethod: "stripe",
      status: "pending",
      paymentStatus: "unpaid",
    });

    // 5. Create Stripe Checkout Session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      // Stripe will redirect here after payment
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    // 6. Save session ID to the order
    order.stripeSessionId = session.id;
    await order.save();

    // 7. Clear the cart now that order is created
    cart.items = [];
    await cart.save();

    return res.status(200).json({
      status: "success",
      data: {
        sessionId: session.id,
        checkoutUrl: session.url,
        orderId: order._id,
      },
      message: "Checkout session created. Redirect user to checkoutUrl.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

// POST /api/payment/webhook
// Stripe calls this automatically when a payment event occurs.
// IMPORTANT: This route must receive the RAW body (not JSON-parsed).
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  const stripe = getStripe();
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw Buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        status: "confirmed",
      });
      console.log(`Order ${orderId} marked as paid and confirmed.`);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "unpaid",
        status: "cancelled",
      });
      console.log(`Order ${orderId} cancelled due to expired session.`);
    }
  }

  // Acknowledge receipt of the event
  res.json({ received: true });
};

// GET /api/payment/verify/:sessionId
// Let the frontend verify payment status after redirect
export const verifyPayment = async (req, res) => {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId,
    );

    const order = await Order.findOne({
      stripeSessionId: req.params.sessionId,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        status: "fail",
        data: null,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        paymentStatus: session.payment_status,
        order,
      },
      message: "Payment status retrieved",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};
