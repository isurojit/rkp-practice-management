import { createSign, createVerify } from "node:crypto";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

export type FireValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null }
  | { arrayValue: { values: FireValue[] } }
  | { mapValue: { fields: FireFields } };

export type FireFields = Record<string, FireValue>;

export interface FireDocument {
  name: string;
  fields?: FireFields;
  createTime?: string;
  updateTime?: string;
}

const certificatesUrl =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certCache: { expires: number; certs: Record<string, string> } | null = null;
let oauthCache: { expires: number; token: string } | null = null;

export function getProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project ID is not configured.");
  return projectId;
}

function serviceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Server provisioning is not configured. Add FIREBASE_SERVICE_ACCOUNT_JSON to Netlify environment variables.",
    );
  }

  let credentials: Partial<ServiceAccount>;
  try {
    credentials = JSON.parse(raw) as Partial<ServiceAccount>;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  if (!credentials.project_id || !credentials.client_email || !credentials.private_key) {
    throw new Error("Firebase service account has missing required fields.");
  }

  if (credentials.project_id !== getProjectId()) {
    throw new Error("Firebase service account belongs to a different project.");
  }

  return credentials as ServiceAccount;
}

function parseJwtPart(value: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
}

async function getPublicCertificates(): Promise<Record<string, string>> {
  if (certCache && Date.now() < certCache.expires) return certCache.certs;

  const response = await fetch(certificatesUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to verify Firebase authentication.");

  const certs = (await response.json()) as Record<string, string>;
  const maxAge = Number(response.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1] || 300);
  certCache = { certs, expires: Date.now() + Math.min(maxAge, 1800) * 1000 };

  return certs;
}

/** Validate bearer token signature, audience, issuer and expiry server-side. */
export async function verifyFirebaseUser(
  authorization: string | null,
): Promise<string | null> {
  const token = authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token || token.length > 12000) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const header = parseJwtPart(parts[0]);
    const payload = parseJwtPart(parts[1]);
    const projectId = getProjectId();
    const now = Math.floor(Date.now() / 1000);

    if (header.alg !== "RS256" || typeof header.kid !== "string") return null;
    if (
      payload.aud !== projectId ||
      payload.iss !== `https://securetoken.google.com/${projectId}` ||
      typeof payload.sub !== "string" ||
      !payload.sub ||
      payload.sub.length > 128 ||
      typeof payload.exp !== "number" ||
      payload.exp <= now ||
      typeof payload.iat !== "number" ||
      payload.iat > now ||
      typeof payload.auth_time !== "number" ||
      payload.auth_time > now
    ) return null;

    const certificates = await getPublicCertificates();
    const certificate = certificates[header.kid];
    if (!certificate) return null;

    const verifier = createVerify("RSA-SHA256");
    verifier.update(parts[0] + "." + parts[1]);
    verifier.end();

    const verified = verifier.verify(certificate, Buffer.from(parts[2], "base64url"));
    return verified ? payload.sub : null;
  } catch {
    return null;
  }
}

/** OAuth access token for Firebase Auth and Firestore administrator REST APIs. */
export async function getServerAccessToken(): Promise<string> {
  if (oauthCache && Date.now() < oauthCache.expires) return oauthCache.token;

  const credentials = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3500,
  })).toString("base64url");

  const signingInput = header + "." + payload;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(credentials.private_key).toString("base64url");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signingInput + "." + signature,
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Firebase server credentials were rejected.");
  const result = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!result.access_token) throw new Error("Firebase server credentials were rejected.");

  oauthCache = {
    token: result.access_token,
    expires: Date.now() + Math.max(60, (result.expires_in || 3600) - 120) * 1000,
  };
  return result.access_token;
}

function documentUrl(collection: string, id: string): string {
  const project = encodeURIComponent(getProjectId());
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
}

export async function readServerDoc(
  collection: string,
  id: string,
): Promise<FireDocument | null> {
  const token = await getServerAccessToken();
  const response = await fetch(documentUrl(collection, id), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to read Firebase record.");
  return (await response.json()) as FireDocument;
}

export function toFirestoreValue(value: unknown): FireValue {
  if (value === undefined || value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { nullValue: null };
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  return { nullValue: null };
}

export function toFirestoreFields(values: Record<string, unknown>): FireFields {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(value)]),
  );
}

export function fromFirestoreValue(value?: FireValue): unknown {
  if (!value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in value) return fromFirestoreFields(value.mapValue.fields || {});
  return null;
}

export function fromFirestoreFields(fields: FireFields = {}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]),
  );
}

export async function writeServerDoc(
  collection: string,
  id: string,
  values: Record<string, unknown>,
): Promise<void> {
  const token = await getServerAccessToken();
  const response = await fetch(documentUrl(collection, id) + "?currentDocument.exists=false", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(values) }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Unable to save the employee profile.");
}

export async function getCallerRole(
  authorization: string | null,
): Promise<{ uid: string; role: string } | null> {
  const uid = await verifyFirebaseUser(authorization);
  if (!uid) return null;

  const profile = await readServerDoc("users", uid);
  const role = profile?.fields?.role;
  const active = profile?.fields?.active;

  if (!role || !("stringValue" in role)) return null;
  if (active && "booleanValue" in active && active.booleanValue === false) return null;
  return { uid, role: role.stringValue };
}

/** Patch named fields, protecting against concurrent assignment edits. */
export async function patchServerDoc(
  collection: string,
  id: string,
  values: Record<string, unknown>,
  expectedUpdateTime?: string,
): Promise<void> {
  const token = await getServerAccessToken();
  const parameters = new URLSearchParams();

  for (const field of Object.keys(values)) {
    parameters.append("updateMask.fieldPaths", field);
  }

  if (expectedUpdateTime) {
    parameters.set("currentDocument.updateTime", expectedUpdateTime);
  }

  const response = await fetch(documentUrl(collection, id) + "?" + parameters.toString(), {
    method: "PATCH",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(values) }),
    cache: "no-store",
  });

  if (response.status === 409 || response.status === 412) {
    throw new Error("This record was updated by someone else. Refresh and try again.");
  }

  if (!response.ok) {
    throw new Error("Unable to save Firebase record. Check server permissions.");
  }
}
