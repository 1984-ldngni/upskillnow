// Server-only helper for the Maya Checkout REST API. Never import this from
// a "use client" file — MAYA_SECRET_KEY must never reach the browser.
//
// Docs: https://developers.maya.ph/reference/createv1checkout
//       https://developers.maya.ph/reference/basic-authentication
//
// Auth is HTTP Basic with the API key as the username and a blank password,
// base64-encoded. Create Checkout uses the PUBLIC key; retrieving payment
// details uses the SECRET key.

const MAYA_API_BASE_URL = process.env.MAYA_API_BASE_URL ?? "https://pg-sandbox.paymaya.com";

// Maya publishes these shared sandbox keys for exploring the API before a
// merchant has their own account (see "Sandbox Credentials and Cards" in
// Maya's docs) — used only as a fallback default so local/sandbox testing
// works before real keys are configured. Anything real (and all of
// production) must come from env vars.
const SANDBOX_FALLBACK_PUBLIC_KEY = "pk-Z0OSzLvIcOI2UIvDhdTGVVfRSSeiGStnceqwUE7n0Ah";
const SANDBOX_FALLBACK_SECRET_KEY = "sk-X8qolYjy62kIzEbr0QRK1h4b4KDVHaNcwMYk39jInSl";

function getPublicKey(): string {
  return process.env.MAYA_PUBLIC_KEY ?? SANDBOX_FALLBACK_PUBLIC_KEY;
}

function getSecretKey(): string {
  return process.env.MAYA_SECRET_KEY ?? SANDBOX_FALLBACK_SECRET_KEY;
}

function basicAuthHeader(apiKey: string): string {
  return "Basic " + Buffer.from(`${apiKey}:`).toString("base64");
}

export type CreateCheckoutParams = {
  amount: number;
  currency: "PHP" | "USD";
  description: string;
  requestReferenceNumber: string;
  redirectUrl: { success: string; failure: string; cancel: string };
  metadata?: Record<string, string>;
};

export type CreateCheckoutResponse = {
  checkoutId: string;
  redirectUrl: string;
};

export async function createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResponse> {
  const res = await fetch(`${MAYA_API_BASE_URL}/checkout/v1/checkouts`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: basicAuthHeader(getPublicKey()),
    },
    body: JSON.stringify({
      totalAmount: { value: params.amount, currency: params.currency },
      requestReferenceNumber: params.requestReferenceNumber,
      redirectUrl: params.redirectUrl,
      items: [
        {
          name: params.description,
          quantity: 1,
          totalAmount: { value: params.amount, currency: params.currency },
        },
      ],
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Maya Create Checkout failed (${res.status}): ${errText}`);
  }

  return res.json();
}

export type MayaPayment = {
  id: string;
  paymentStatus: string;
  amount?: string;
  currency?: string;
  fundSource?: { type?: string };
  requestReferenceNumber?: string;
  [key: string]: unknown;
};

export async function getPayment(paymentId: string): Promise<MayaPayment> {
  const res = await fetch(`${MAYA_API_BASE_URL}/payments/v1/payments/${paymentId}`, {
    headers: { authorization: basicAuthHeader(getSecretKey()) },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Maya Retrieve Payment failed (${res.status}): ${errText}`);
  }

  return res.json();
}

// Maya restricts webhook delivery to these fixed source IPs instead of
// signing requests with a shared secret (unlike Stripe). Behind Vercel the
// real client IP arrives via x-forwarded-for, not the raw socket address.
const MAYA_WEBHOOK_IPS = new Set([
  "13.229.160.234", // sandbox
  "3.1.199.75", // sandbox
  "18.138.50.235", // production
  "3.1.207.200", // production
]);

export function isMayaWebhookIp(ip: string | null): boolean {
  if (!ip) return false;
  return MAYA_WEBHOOK_IPS.has(ip.trim());
}

// Maps a Maya fundSource.type to our simplified payment_method column.
export function mapPaymentMethod(fundSourceType: string | undefined): "card" | "gcash" | "maya" | null {
  if (!fundSourceType) return null;
  if (fundSourceType === "card") return "card";
  if (fundSourceType === "maya-wallet") return "maya";
  // Maya's "qrph" fund source covers GCash and other QR Ph-participating
  // apps; without a more specific field this is the closest mapping.
  if (fundSourceType === "qrph") return "gcash";
  return null;
}
