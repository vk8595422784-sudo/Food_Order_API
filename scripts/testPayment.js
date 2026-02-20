import "dotenv/config";

const BASE = `http://localhost:${process.env.PORT || 8000}`;

const req = async (method, path, body, token) => {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
};

const log = (label, ok, detail = "") => {
  console.log(`${ok ? "✅" : "❌"} ${label}${detail ? `  →  ${detail}` : ""}`);
};

console.log("\n🚀 STRIPE PAYMENT END-TO-END TEST\n" + "━".repeat(45));

// ── Step 1: Login as admin ───────────────────────────────────────────────────
console.log("\n[1] Logging in as admin...");
let r = await req("POST", "/api/users/login", {
  email: "admin@test.com",
  password: "admin123",
});
const adminToken = r.body.token;
log("Admin login", !!adminToken, r.body.message);
if (!adminToken) {
  console.error("❌ Cannot continue without admin token");
  process.exit(1);
}

// ── Step 2: Login as user ────────────────────────────────────────────────────
console.log("\n[2] Logging in as test user...");
r = await req("POST", "/api/users/login", {
  email: "testuser@test.com",
  password: "password123",
});
let userToken = r.body.token;

// If user doesn't exist yet, register them
if (!userToken) {
  console.log("   User not found, registering...");
  r = await req("POST", "/api/users/register", {
    name: "Test User",
    email: "testuser@test.com",
    password: "password123",
  });
  userToken = r.body.token;
}
log("User login", !!userToken, r.body.message);
if (!userToken) {
  console.error("❌ Cannot continue without user token");
  process.exit(1);
}

// ── Step 3: Create a food item ───────────────────────────────────────────────
console.log("\n[3] Creating test food item (admin)...");
r = await req(
  "POST",
  "/api/foods",
  {
    name: "Stripe Test Pizza",
    price: 299,
    description: "A pizza to test Stripe payments",
    category: "Pizza",
  },
  adminToken,
);
const foodId = r.body.data?._id;
log(
  "Food created",
  r.status === 200,
  `id=${foodId} price=₹${r.body.data?.price}`,
);
if (!foodId) {
  console.error("❌ Cannot continue without food id");
  process.exit(1);
}

// ── Step 4: Clear cart & add food ───────────────────────────────────────────
console.log("\n[4] Adding food to cart...");
await req("DELETE", "/api/cart/clear", null, userToken);
r = await req("POST", "/api/cart", { foodId, quantity: 2 }, userToken);
const cartTotal =
  r.body.data?.items?.[0]?.priceSnapshot * r.body.data?.items?.[0]?.quantity;
log("Item added to cart", r.status === 200, `qty=2  total=₹${cartTotal}`);

// ── Step 5: Create Stripe Checkout Session ───────────────────────────────────
console.log("\n[5] Creating Stripe checkout session...");
r = await req(
  "POST",
  "/api/payment/create-checkout-session",
  {
    address: "123 Test Street, Mumbai",
  },
  userToken,
);

if (r.status !== 200) {
  console.log("❌ Checkout session FAILED");
  console.log("   Status:", r.status);
  console.log("   Error:", r.body.message);
  console.log(
    "\n💡 Make sure STRIPE_SECRET_KEY in .env is valid (sk_test_...)",
  );
  process.exit(1);
}

const { sessionId, checkoutUrl, orderId } = r.body.data;
log("Checkout session created", true, `orderId=${orderId}`);
console.log("\n" + "━".repeat(45));
console.log("💳 CHECKOUT URL (open this in browser to pay):");
console.log("\n   " + checkoutUrl);
console.log("\n" + "━".repeat(45));
console.log("   Use Stripe test card:  4242 4242 4242 4242");
console.log("   Expiry: any future date  |  CVC: any 3 digits");
console.log("   Name/Address: anything");
console.log("━".repeat(45));

// ── Step 6: Verify order created as unpaid/pending ──────────────────────────
console.log("\n[6] Checking order status before payment...");
r = await req("GET", "/api/orders", null, userToken);
const order = r.body.data?.find((o) => o._id === orderId);
log(
  "Order exists in DB",
  !!order,
  `status=${order?.status} paymentStatus=${order?.paymentStatus}`,
);

// ── Step 7: Verify cart was cleared ─────────────────────────────────────────
console.log("\n[7] Verifying cart was cleared after session created...");
r = await req("GET", "/api/cart", null, userToken);
log(
  "Cart cleared after checkout",
  r.body.data?.items?.length === 0,
  `items=${r.body.data?.items?.length}`,
);

// ── Step 8: Simulate webhook (stripe trigger if CLI available) ───────────────
console.log("\n[8] Webhook simulation...");
console.log("   To simulate payment completion, run in a separate terminal:");
console.log(`   stripe trigger checkout.session.completed`);
console.log(
  "\n   OR if the Stripe CLI is listening, complete payment in browser above.",
);
console.log("   After payment, verify with:");
console.log(`\n   node scripts/verifyOrder.js ${orderId} <your-user-token>`);

// ── Step 9: Clean up test food ───────────────────────────────────────────────
console.log("\n[9] Cleaning up test food item...");
r = await req("DELETE", `/api/foods/${foodId}`, null, adminToken);
log("Test food deleted", r.status === 200);

console.log("\n✅ PAYMENT FLOW TEST COMPLETE");
console.log("━".repeat(45));
console.log("Stripe session ID:  " + sessionId);
console.log("Order ID:           " + orderId);
console.log("━".repeat(45) + "\n");
