const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, NEXTAUTH_URL } = process.env;

const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export async function generatePayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("Missing Api credentials!");
  }
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  console.log(API_BASE)
  const response = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to generate access token from PayPal!");
  }
  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(
  plan: string,
  price: string,
  currency: string,
  interval: string
) {
  const accessToken = await generatePayPalAccessToken();
  const url = `${API_BASE}/v2/checkout/orders`;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: price,
        },
        description: `Subscription plan: ${plan} (${interval})`,
        custom_id: JSON.stringify({ plan, interval }),
      },
    ],
    application_context: {
      return_url: `${NEXTAUTH_URL}/api/payments/paypal/callback`,
      cancel_url: `${NEXTAUTH_URL}`,
      user_action: "PAY_NOW",
      brand_name: "Invixy",
      shipping_preference: "NO_SHIPPING",
    },
  };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("PayPal Order Creation Failed:", JSON.stringify(error, null, 2));
    throw new Error(error.message || "Failed to create order");
  }
  const data = await response.json();
  return data;
}

export async function capturePayPalPayment(orderId: string) {
  const accessToken = await generatePayPalAccessToken();
  const url = `${API_BASE}/v2/checkout/orders/${orderId}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to capture payment");
  }

  return response.json();
}
