import { spawn, spawnSync } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import process from "node:process"
import { chromium } from "playwright-core"
import { resolveFirebaseRuntimeConfig } from "../../src/core/firebase/runtimeConfig.js"

const EXPECTED_PROJECT_ID = "demo-money-mind-e2e"
const BASE_URL = "http://127.0.0.1:4178"
const AUTH_URL = "http://127.0.0.1:9099"
const FIRESTORE_URL = "http://127.0.0.1:8080"
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"])

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.status < 500) return
    } catch {
      // Retry until the bounded deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function requireEmulator(url, label) {
  try {
    const response = await fetch(url)
    assert(response.status < 500, `${label} returned HTTP ${response.status}`)
  } catch (error) {
    throw new Error(`${label} is not reachable at ${url}. Start the Windows-host emulators first.`, { cause: error })
  }
}

async function createUser(email, password) {
  const response = await fetch(`${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=phase1g-local-only`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const payload = await response.json()
  assert(response.ok && payload.localId, `Auth emulator user creation failed: ${JSON.stringify(payload)}`)
  return payload
}

async function deleteUser(idToken) {
  const response = await fetch(`${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:delete?key=phase1g-local-only`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  })
  assert(response.ok, `Synthetic Auth user cleanup failed: ${await response.text()}`)
}

async function deleteEvidenceWithToken(user, documentId) {
  const encodedPath = `users/${encodeURIComponent(user.localId)}/e2eEvidence/${encodeURIComponent(documentId)}`
  const response = await fetch(`${FIRESTORE_URL}/v1/projects/${EXPECTED_PROJECT_ID}/databases/(default)/documents/${encodedPath}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${user.idToken}` },
  })
  assert(response.ok || response.status === 404, `Synthetic Firestore cleanup failed for ${user.localId}: ${await response.text()}`)
}

function startVite(runDirectory, { port = 4178, projectId = EXPECTED_PROJECT_ID } = {}) {
  const viteBin = path.resolve("node_modules/vite/bin/vite.js")
  assert(existsSync(viteBin), `Vite entry point not found: ${viteBin}`)
  return spawn(process.execPath, [viteBin, "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TEMP: runDirectory,
      TMP: runDirectory,
      VITE_FIREBASE_EMULATORS: "true",
      VITE_FIREBASE_PROJECT_ID: projectId,
      VITE_V2_ENABLED: "true",
      VITE_V2_APP_SHELL: "true",
      VITE_V2_SPATIAL_UI: "true",
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
}

function verifyFailClosedConfiguration() {
  assert(resolveFirebaseRuntimeConfig({ VITE_FIREBASE_EMULATORS: "false", VITE_FIREBASE_PROJECT_ID: "money-mind-90176" }).projectId === "money-mind-90176", "Production Firebase configuration changed")
  assert(resolveFirebaseRuntimeConfig({ VITE_FIREBASE_EMULATORS: "true", VITE_FIREBASE_PROJECT_ID: EXPECTED_PROJECT_ID }).projectId === EXPECTED_PROJECT_ID, "Demo emulator configuration was rejected")
  try {
    resolveFirebaseRuntimeConfig({ VITE_FIREBASE_EMULATORS: "true", VITE_FIREBASE_PROJECT_ID: "money-mind-90176" })
  } catch (error) {
    assert(error.message.includes(`VITE_FIREBASE_PROJECT_ID=${EXPECTED_PROJECT_ID}`), `Unexpected fail-closed error: ${error.message}`)
    return
  }
  throw new Error("Emulator mode accepted the production Firebase project ID")
}

function stopProcess(child) {
  if (!child || child.exitCode !== null) return
  if (process.platform === "win32") spawnSync("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" })
  else child.kill("SIGTERM")
}

async function configureLocalOnlyContext(browser, options = {}) {
  const blocked = []
  const completedNonLocal = []
  const requests = []
  const context = await browser.newContext({ serviceWorkers: "block", ...options })
  context.on("request", (request) => requests.push(request.url()))
  context.on("requestfinished", (request) => {
    const url = new URL(request.url())
    if (["http:", "https:"].includes(url.protocol) && !LOCAL_HOSTS.has(url.hostname)) completedNonLocal.push(request.url())
  })
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url())
    if (["http:", "https:"].includes(url.protocol) && !LOCAL_HOSTS.has(url.hostname)) {
      blocked.push(route.request().url())
      await route.abort("blockedbyclient")
      return
    }
    await route.continue()
  })
  return { blocked, completedNonLocal, context, requests }
}

async function loginThroughMoneyMind(page, email, password, expectedUid) {
  await page.goto(`${BASE_URL}/#login`, { waitUntil: "domcontentloaded" })
  const form = page.locator("form.auth-card")
  try {
    await form.waitFor({ timeout: 60_000 })
  } catch (error) {
    const body = await page.locator("body").innerText().catch(() => "<body unavailable>")
    throw new Error(`Money Mind login did not render at ${page.url()}. Body: ${body.slice(0, 1_000)}`, { cause: error })
  }
  await form.locator('input[type="email"]').fill(email)
  await form.locator('input[autocomplete="current-password"]').fill(password)
  await form.locator("button.auth-submit").click()
  await page.waitForFunction(async (uid) => {
    const { auth } = await import("/src/firebase.js")
    return auth.currentUser?.uid === uid
  }, expectedUid, { timeout: 20_000 })
  await page.getByTestId("v2-app").waitFor({ timeout: 20_000 })
}

async function firestoreOperation(page, operation, values) {
  return page.evaluate(async ({ operation, values }) => {
    const probe = await import("/src/e2e/phase1gFirebaseProbe.js")
    if (operation === "write") return probe.writeEvidence(values)
    if (operation === "read") return probe.readEvidence(values)
    if (operation === "delete") return probe.deleteEvidence(values)
    if (operation === "expect-denied-read") return probe.expectEvidenceDenied(values, "read")
    if (operation === "expect-denied-write") return probe.expectEvidenceDenied(values, "write")
    if (operation === "sign-out") return probe.signOutForRulesProbe()
    throw new Error(`Unknown operation: ${operation}`)
  }, { operation, values })
}

const runDirectory = await mkdtemp(path.join(process.env.TEMP || os.tmpdir(), "phase1g-node-"))
const chromePath = process.env.PHASE1G_CHROME_PATH
assert(chromePath && existsSync(chromePath), "PHASE1G_CHROME_PATH must identify Chrome or Edge")

let vite
let browser
let owner
let other
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`
const password = "Phase1G-Local-987!"
const documentId = `phase1g-${stamp}`

try {
  verifyFailClosedConfiguration()
  await requireEmulator(AUTH_URL, "Auth emulator")
  await requireEmulator(FIRESTORE_URL, "Firestore emulator")
  owner = await createUser(`phase1g-owner-${stamp}@example.test`, password)
  other = await createUser(`phase1g-other-${stamp}@example.test`, password)

  vite = startVite(runDirectory)
  let viteOutput = ""
  vite.stdout.on("data", (chunk) => { viteOutput += chunk.toString() })
  vite.stderr.on("data", (chunk) => { viteOutput += chunk.toString() })
  vite.once("exit", (code) => { if (code && code !== 0) process.stderr.write(viteOutput) })
  await waitForServer(BASE_URL)

  browser = await chromium.launch({ executablePath: chromePath, headless: true })
  const ownerLane = await configureLocalOnlyContext(browser)
  const otherLane = await configureLocalOnlyContext(browser)
  const ownerPage = await ownerLane.context.newPage()
  const otherPage = await otherLane.context.newPage()
  for (const [name, page] of [["owner", ownerPage], ["other", otherPage]]) {
    page.on("pageerror", (error) => console.error(`[${name}:pageerror] ${error.stack || error.message}`))
    page.on("console", (message) => {
      if (message.type() === "error") console.error(`[${name}:console] ${message.text()}`)
    })
  }

  await loginThroughMoneyMind(otherPage, other.email, password, other.localId)
  await firestoreOperation(otherPage, "write", { uid: other.localId, documentId, data: { owner: "B", synthetic: true } })

  await loginThroughMoneyMind(ownerPage, owner.email, password, owner.localId)
  const functionsProbe = await ownerPage.evaluate(async () => {
    const probe = await import("/src/e2e/phase1gFirebaseProbe.js")
    return probe.probeFunctionsLoopback()
  })
  assert(functionsProbe.failedLocally, "The isolated Functions probe unexpectedly succeeded")
  const functionsRequest = ownerLane.requests.find((requestUrl) => {
    const url = new URL(requestUrl)
    return url.hostname === "127.0.0.1" && url.port === "5001" && url.pathname.includes(`/demo-money-mind-e2e/`)
  })
  assert(functionsRequest, "No Functions request targeted 127.0.0.1:5001 for demo-money-mind-e2e")
  const ownWrite = await firestoreOperation(ownerPage, "write", { uid: owner.localId, documentId, data: { owner: "A", synthetic: true } })
  assert(ownWrite.uid === owner.localId && ownWrite.projectId === EXPECTED_PROJECT_ID, "User A did not write through the isolated emulator project")
  const ownRead = await firestoreOperation(ownerPage, "read", { uid: owner.localId, documentId })
  assert(ownRead.exists && ownRead.data.owner === "A", "User A could not read authorized data")

  const deniedRead = await firestoreOperation(ownerPage, "expect-denied-read", { uid: other.localId, documentId })
  const deniedWrite = await firestoreOperation(ownerPage, "expect-denied-write", { uid: other.localId, documentId, data: { owner: "A", synthetic: true } })
  assert(deniedRead.denied, `User A cross-user read was not denied (${deniedRead.code})`)
  assert(deniedWrite.denied, `User A cross-user write was not denied (${deniedWrite.code})`)

  const signedOutForRules = await firestoreOperation(ownerPage, "sign-out", {})
  assert(signedOutForRules.signedOut, "User A did not sign out for the unauthenticated Rules check")
  const anonymousRead = await firestoreOperation(ownerPage, "expect-denied-read", { uid: owner.localId, documentId })
  const anonymousWrite = await firestoreOperation(ownerPage, "expect-denied-write", { uid: owner.localId, documentId, data: { anonymous: true } })
  assert(anonymousRead.denied && anonymousWrite.denied, "Unauthenticated Firestore access was not denied")

  await loginThroughMoneyMind(ownerPage, owner.email, password, owner.localId)
  await ownerPage.getByTestId("spatial-node-money-movement").click()
  await ownerPage.getByTestId("v2-active-module").filter({ hasText: "Money Movement" }).waitFor()
  await ownerPage.getByTestId("v2-submodule-transactions").click()
  await ownerPage.getByRole("heading", { name: "Transactions", exact: true }).waitFor({ timeout: 15_000 })
  assert(ownerPage.url().endsWith("#transactions"), "Transactions workspace route was not activated")
  await ownerPage.getByTestId("v2-return-from-classic").click()
  await ownerPage.getByTestId("v2-app").waitFor()

  await ownerPage.goBack()
  await ownerPage.getByTestId("v2-app").waitFor()
  assert(new URL(ownerPage.url()).hash === "#dashboard", `Back navigation reached the wrong route: ${ownerPage.url()}`)
  await ownerPage.goForward()
  await ownerPage.getByTestId("v2-app").waitFor()
  assert(new URL(ownerPage.url()).hash === "#transactions", `Forward navigation reached the wrong route: ${ownerPage.url()}`)
  await ownerPage.reload({ waitUntil: "domcontentloaded" })
  await ownerPage.getByTestId("v2-app").waitFor({ timeout: 20_000 })

  await ownerPage.setViewportSize({ width: 844, height: 390 })
  await ownerPage.getByTestId("spatial-node-money-movement").click()
  await ownerPage.getByTestId("v2-submodule-transactions").waitFor()
  await ownerPage.getByTestId("v2-back-to-core").click()
  await ownerPage.getByText("Money Mind Core", { exact: true }).waitFor()

  await firestoreOperation(ownerPage, "delete", { uid: owner.localId, documentId })
  await firestoreOperation(otherPage, "delete", { uid: other.localId, documentId })
  const ownerAfterCleanup = await firestoreOperation(ownerPage, "read", { uid: owner.localId, documentId })
  const otherAfterCleanup = await firestoreOperation(otherPage, "read", { uid: other.localId, documentId })
  assert(!ownerAfterCleanup.exists && !otherAfterCleanup.exists, "Synthetic Firestore documents were not cleaned up")

  await ownerPage.getByTestId("v2-profile").click()
  await ownerPage.getByTestId("v2-sign-out").click()
  await ownerPage.locator("form.auth-card").waitFor({ timeout: 15_000 })

  const ownerUid = owner.localId
  const otherUid = other.localId
  await deleteUser(owner.idToken)
  await deleteUser(other.idToken)
  owner = null
  other = null

  const allLanes = [ownerLane, otherLane]
  assert(allLanes.every((lane) => lane.completedNonLocal.length === 0), "A browser request reached a non-loopback endpoint")
  console.log(JSON.stringify({
    result: "PASS",
    projectId: EXPECTED_PROJECT_ID,
    auth: { actualLogin: true, userA: ownerUid, userB: otherUid, signOut: true },
    rules: { ownerReadWrite: true, crossUserReadDenied: true, crossUserWriteDenied: true, unauthenticatedReadWriteDenied: true },
    functional: { coreToTransactionsToV2: true, backForward: true, refresh: true, mobileLandscape: true },
    cleanup: { firestoreDocuments: true, authUsers: true },
    isolation: { wrongProjectFailsClosed: true, functionsRoutedToLoopback: true },
    network: { completedNonLoopback: 0, blockedAttempts: [...new Set(allLanes.flatMap((lane) => lane.blocked))] },
  }, null, 2))
} finally {
  await browser?.close().catch(() => {})
  stopProcess(vite)
  if (owner?.idToken) await deleteEvidenceWithToken(owner, documentId).catch((error) => console.error(error.message))
  if (other?.idToken) await deleteEvidenceWithToken(other, documentId).catch((error) => console.error(error.message))
  if (owner?.idToken) await deleteUser(owner.idToken).catch((error) => console.error(error.message))
  if (other?.idToken) await deleteUser(other.idToken).catch((error) => console.error(error.message))
  await rm(runDirectory, { recursive: true, force: true })
}
