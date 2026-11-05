// Run only against the explicitly configured local demo emulators. This test
// creates synthetic users and documents; it must never target production.
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const projectId = "demo-money-mind-e2e";
if (process.env.GCLOUD_PROJECT !== projectId ||
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080" ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099") {
  throw new Error("Refusing to run: explicitly configure the demo project and both loopback emulators.");
}

const admin = require("firebase-admin");
admin.initializeApp({ projectId });
const db = admin.firestore();
const authBase = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts";
const dbBase = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`;
const syntheticId = randomUUID();

async function request(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
}
async function signup(label) {
  const response = await request(`${authBase}:signUp?key=demo-only`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `${label}-${syntheticId}@example.invalid`, password: `Demo-${syntheticId}`, returnSecureToken: true }),
  });
  assert.equal(response.status, 200, "synthetic Auth emulator signup");
  return response.json();
}
async function client(method, path, token, body) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return request(`${dbBase}/${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
}
async function main() {
  const users = [];
  const created = [];
  try {
    const a = await signup("a"); users.push(a);
    const b = await signup("b"); users.push(b);
    const root = `users/${a.localId}`;
    const financial = `${root}/transactions/${syntheticId}`;
    const counter = `${root}/moneyAIUsage/agentQuery`;
    const nested = `${counter}/nested/${syntheticId}`;
    await db.doc(counter).set({ requestCount: 10, windowStartedAt: Date.now() }); created.push(counter);
    await db.doc(nested).set({ synthetic: true }); created.push(nested);
    const body = { fields: { note: { stringValue: "synthetic" } } };
    assert.equal((await client("PATCH", financial, a.idToken, body)).status, 200, "owner can write ordinary document"); created.push(financial);
    assert.equal((await client("GET", financial, a.idToken)).status, 200, "owner can read ordinary document");
    for (const method of ["GET", "PATCH", "DELETE"]) {
      assert.equal((await client(method, counter, a.idToken, method === "PATCH" ? body : undefined)).status, 403, `owner cannot ${method} server counter`);
      assert.equal((await client(method, counter, b.idToken, method === "PATCH" ? body : undefined)).status, 403, `other user cannot ${method} server counter`);
      assert.equal((await client(method, counter, null, method === "PATCH" ? body : undefined)).status, 403, `unauthenticated client cannot ${method} server counter`);
      assert.equal((await client(method, financial, b.idToken, method === "PATCH" ? body : undefined)).status, 403, `other user cannot ${method} financial record`);
    }
    assert.equal((await client("PATCH", `${root}/moneyAIUsage/unexpected-${syntheticId}`, a.idToken, body)).status, 403, "owner cannot create another counter");
    assert.equal((await client("GET", nested, a.idToken)).status, 403, "owner cannot read counter descendants");
    assert.equal((await client("PATCH", nested, a.idToken, body)).status, 403, "owner cannot write counter descendants");
    assert.equal((await client("GET", financial, null)).status, 403, "unauthenticated read denied");
    assert.equal((await client("PATCH", financial, null, body)).status, 403, "unauthenticated write denied");
    console.log("Demo emulator rules checks passed; callable concurrency remains a separate test.");
  } finally {
    for (const path of created.reverse()) await db.doc(path).delete();
    for (const user of users) await request(`${authBase}:delete?key=demo-only`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: user.idToken }) });
    await admin.app().delete();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
