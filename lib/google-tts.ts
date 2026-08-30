import { createSign } from "crypto";

// Calls Google Cloud's Text-to-Speech REST API directly via a hand-signed
// service-account JWT, rather than pulling in the official
// @google-cloud/text-to-speech SDK. That package drags in grpc/protobuf
// dependencies that meaningfully bloat the serverless bundle and install
// time for what's a single REST call — Node's built-in `crypto` module
// already does RS256 signing, so there's nothing the SDK buys us here.
//
// Credentials live in GOOGLE_TTS_CREDENTIALS_BASE64 (base64-encoded service
// account JSON key, least-privilege "Cloud Speech Editor" role, project
// upskillnow-tts) rather than a credentials file, since Vercel env vars are
// the only place to put secrets in this deployment.

type ServiceAccountKey = {
  client_email: string;
  private_key: string;
  token_uri: string;
  project_id: string;
};

function loadServiceAccountKey(): ServiceAccountKey {
  const b64 = process.env.GOOGLE_TTS_CREDENTIALS_BASE64;
  if (!b64) throw new Error("GOOGLE_TTS_CREDENTIALS_BASE64 is not set");
  const json = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
  return json;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(key: ServiceAccountKey): Promise<string> {
  // Reuse a still-valid token across calls within the same warm serverless
  // instance instead of re-signing a JWT and round-tripping to Google's
  // token endpoint on every single narration request.
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) {
    return cachedToken.token;
  }

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: key.token_uri,
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = base64url(signer.sign(key.private_key));
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch(key.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${JSON.stringify(data)}`);
  }
  cachedToken = { token: data.access_token, expiresAt: now + (data.expires_in ?? 3600) };
  return data.access_token;
}

// en-US-Neural2-D: a single consistent voice across every lesson, so the
// course doesn't sound like a different narrator from video to video.
const DEFAULT_VOICE = "en-US-Neural2-D";

export async function synthesizeSpeechBase64(text: string, voice: string = DEFAULT_VOICE): Promise<string> {
  const key = loadServiceAccountKey();
  const token = await getAccessToken(key);

  const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "x-goog-user-project": key.project_id,
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "en-US", name: voice },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Text-to-Speech synthesis failed: ${JSON.stringify(data)}`);
  }
  return data.audioContent as string; // already base64-encoded MP3 bytes
}
