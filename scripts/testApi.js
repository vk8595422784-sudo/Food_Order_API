import "dotenv/config";

const BASE = `http://localhost:${process.env.PORT || 8000}`;
let passed = 0;
let failed = 0;
let userToken = "";
let adminToken = "";
let foodId = "";
let orderId = "";

const req = async (method, path, body, token) => {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
};

const check = (label, cond, detail = "") => {
  if (cond) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.log(`  ❌  ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
};

// ─── USER TESTS ─────────────────────────────────────────────────────────────
console.log("\n━━━ USER TESTS ━━━");

// Register
let r = await req("POST", "/api/users/register", {
  name: "Test User",
  email: `user_${Date.now()}@test.com`,
  password: "password123",
});
check("Register new user → 201", r.status === 201, JSON.stringify(r.body));
userToken = r.body.token;
const userEmail = r.body.data?.email;

// Duplicate email
r = await req("POST", "/api/users/register", {
  name: "Test User",
  email: userEmail,
  password: "password123",
});
check("Duplicate email → 409", r.status === 409, r.body.message);

// Missing fields
r = await req("POST", "/api/users/register", { email: "x@x.com" });
check("Missing fields → 400", r.status === 400, r.body.message);

// Login success
r = await req("POST", "/api/users/login", {
  email: userEmail,
  password: "password123",
});
check("Login success → 200", r.status === 200, r.body.message);
userToken = r.body.token;

// Wrong password
r = await req("POST", "/api/users/login", {
  email: userEmail,
  password: "wrongpassword",
});
check("Wrong password → 401", r.status === 401, r.body.message);

// User not found
r = await req("POST", "/api/users/login", {
  email: "nobody@nowhere.com",
  password: "password123",
});
check("User not found → 404", r.status === 404, r.body.message);

// Admin login
r = await req("POST", "/api/users/login", {
  email: "admin@test.com",
  password: "admin123",
});
check(
  "Admin login → 200",
  r.status === 200 && r.body.data?.role === "admin",
  `role=${r.body.data?.role}`,
);
adminToken = r.body.token;

// ─── AUTH MIDDLEWARE TESTS ───────────────────────────────────────────────────
console.log("\n━━━ AUTH MIDDLEWARE ━━━");

r = await req("GET", "/api/cart");
check("No token → 401", r.status === 401, r.body.message);

r = await req("GET", "/api/cart", null, "bad.token.here");
check("Invalid token → 401", r.status === 401, r.body.message);

// ─── FOOD TESTS ──────────────────────────────────────────────────────────────
console.log("\n━━━ FOOD TESTS ━━━");

r = await req("GET", "/api/foods");
check("GET all foods (public, no token) → 200", r.status === 200);

r = await req(
  "POST",
  "/api/foods",
  { name: "Burger", price: 150, category: "Fast Food" },
  userToken,
);
check("Non-admin create food → 403", r.status === 403, r.body.message);

r = await req(
  "POST",
  "/api/foods",
  { name: "Burger", price: 150, category: "Fast Food" },
  adminToken,
);
check(
  "Admin create food → 200",
  r.status === 200 && r.body.data?.name === "Burger",
  r.body.message,
);
foodId = r.body.data?._id;

r = await req("POST", "/api/foods", { price: 100 }, adminToken);
check("Admin create food missing name → 400", r.status === 400, r.body.message);

r = await req("GET", "/api/foods?category=Fast Food");
check(
  "Filter by category → 200",
  r.status === 200 && Array.isArray(r.body.data),
);

r = await req("GET", "/api/foods?available=true");
check(
  "Filter by availability → 200",
  r.status === 200 && Array.isArray(r.body.data),
);

r = await req("PUT", `/api/foods/${foodId}`, { price: 200 }, adminToken);
check(
  "Admin update food → 200",
  r.status === 200 && r.body.data?.price === 200,
  r.body.message,
);

r = await req("PUT", `/api/foods/${foodId}`, { price: 200 }, userToken);
check("Non-admin update food → 403", r.status === 403);

// ─── CART TESTS ──────────────────────────────────────────────────────────────
console.log("\n━━━ CART TESTS ━━━");

r = await req("GET", "/api/cart", null, userToken);
check("GET empty cart → 200", r.status === 200);

r = await req("POST", "/api/cart", { foodId, quantity: 2 }, userToken);
check(
  "Add item to cart → 200",
  r.status === 200 && r.body.data?.items?.length > 0,
  r.body.message,
);

r = await req("POST", "/api/cart", { foodId, quantity: 1 }, userToken);
check(
  "Add same item again (qty increases) → 200",
  r.status === 200 && r.body.data?.items?.[0]?.quantity === 3,
  `qty=${r.body.data?.items?.[0]?.quantity}`,
);

r = await req("POST", "/api/cart", { quantity: 2 }, userToken);
check("Add to cart missing foodId → 400", r.status === 400, r.body.message);

r = await req(
  "POST",
  "/api/cart",
  { foodId: "000000000000000000000000", quantity: 2 },
  userToken,
);
check("Add non-existent food → 404", r.status === 404, r.body.message);

r = await req("GET", "/api/cart", null, userToken);
check(
  "GET cart with items → 200",
  r.status === 200 && r.body.data?.items?.length > 0,
);

r = await req("DELETE", `/api/cart/${foodId}`, null, userToken);
check("Remove item from cart → 200", r.status === 200, r.body.message);

// Re-add item for order test
await req("POST", "/api/cart", { foodId, quantity: 2 }, userToken);

// ─── ORDER TESTS ─────────────────────────────────────────────────────────────
console.log("\n━━━ ORDER TESTS ━━━");

r = await req(
  "POST",
  "/api/orders",
  { address: "123 Test St", paymentMethod: "cod" },
  userToken,
);
check("Place order (COD) → 201", r.status === 201, r.body.message);
orderId = r.body.data?._id;

r = await req(
  "POST",
  "/api/orders",
  { address: "123", paymentMethod: "cod" },
  userToken,
);
check("Place order with empty cart → 400", r.status === 400, r.body.message);

r = await req("GET", "/api/orders", null, userToken);
check(
  "Get my orders → 200",
  r.status === 200 && r.body.data?.length > 0,
  r.body.message,
);

r = await req("GET", `/api/orders/${orderId}`, null, userToken);
check(
  "Get order by ID → 200",
  r.status === 200 && r.body.data?._id === orderId,
  r.body.message,
);

r = await req("GET", `/api/orders/${orderId}`, null, adminToken);
check("Other user can't see order → 404", r.status === 404, r.body.message);

r = await req("PUT", `/api/orders/${orderId}/cancel`, null, userToken);
check("Cancel pending order → 200", r.status === 200, r.body.message);

r = await req("PUT", `/api/orders/${orderId}/cancel`, null, userToken);
check("Cancel already-cancelled order → 400", r.status === 400, r.body.message);

// ─── CLEAR CART ──────────────────────────────────────────────────────────────
console.log("\n━━━ CART CLEAR TEST ━━━");
await req("POST", "/api/cart", { foodId, quantity: 1 }, userToken);
r = await req("DELETE", "/api/cart/clear", null, userToken);
check("Clear cart → 200", r.status === 200, r.body.message);

r = await req("GET", "/api/cart", null, userToken);
check(
  "Cart is empty after clear → 200",
  r.status === 200 && r.body.data?.items?.length === 0,
);

// ─── ADMIN TESTS ─────────────────────────────────────────────────────────────
console.log("\n━━━ ADMIN TESTS ━━━");

r = await req("GET", "/api/admin/stats", null, userToken);
check("Non-admin access admin route → 403", r.status === 403, r.body.message);

r = await req("GET", "/api/admin/stats", null, adminToken);
check(
  "Admin get stats → 200",
  r.status === 200 && r.body.data?.totalOrders !== undefined,
  r.body.message,
);

r = await req("GET", "/api/admin/orders", null, adminToken);
check(
  "Admin get all orders → 200",
  r.status === 200 && Array.isArray(r.body.data),
  r.body.message,
);

r = await req(
  "PUT",
  `/api/admin/orders/${orderId}/status`,
  { status: "delivered" },
  adminToken,
);
check(
  "Admin update order status → 200",
  r.status === 200 && r.body.data?.status === "delivered",
  r.body.message,
);

r = await req(
  "PUT",
  `/api/admin/orders/${orderId}/status`,
  { status: "flying" },
  adminToken,
);
check("Admin invalid status → 400", r.status === 400, r.body.message);

r = await req("GET", "/api/admin/users", null, adminToken);
check(
  "Admin get all users → 200",
  r.status === 200 && Array.isArray(r.body.data),
  r.body.message,
);

// ─── ADMIN DELETE FOOD ───────────────────────────────────────────────────────
console.log("\n━━━ FOOD DELETE TEST ━━━");
r = await req("DELETE", `/api/foods/${foodId}`, null, adminToken);
check("Admin delete food → 200", r.status === 200, r.body.message);

r = await req("DELETE", `/api/foods/${foodId}`, null, userToken);
check("Non-admin delete food → 403", r.status === 403, r.body.message);

// ─── SUMMARY ────────────────────────────────────────────────────────────────
console.log(`\n${"━".repeat(40)}`);
console.log(
  `  RESULTS: ${passed} passed  |  ${failed} failed  |  ${passed + failed} total`,
);
console.log("━".repeat(40));
if (failed > 0) process.exit(1);
