import { spawn, spawnSync } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import process from "node:process"
import net from "node:net"
import { chromium } from "playwright-core"
import { resolveFirebaseRuntimeConfig } from "../../src/core/firebase/runtimeConfig.js"
import { MODULE_REGISTRY } from "../../src/app/v2/modules/moduleRegistry.js"
import pageInfo from "../../src/constants/pageInfo.js"

const EXPECTED_PROJECT_ID = "demo-money-mind-e2e"
let BASE_URL
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

async function findAvailablePort() {
  const server = net.createServer()
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const { port } = server.address()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}

async function requireEmulator(url, label) {
  try {
    const response = await fetch(url)
    assert(response.status < 500, `${label} returned HTTP ${response.status}`)
  } catch (error) {
    const code = error?.cause?.code ?? error?.code
    const hint = code === "EACCES"
      ? "Loopback access is blocked in this execution environment; run this script from ordinary Windows PowerShell outside the sandbox."
      : "Start the Windows-host emulators first."
    throw new Error(`${label} is not reachable at ${url}${code ? ` (${code})` : ""}. ${hint}`, { cause: error })
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

function startVite(runDirectory, { port, projectId = EXPECTED_PROJECT_ID } = {}) {
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
  for (const projectId of ["money-mind-90176", "", undefined]) {
    try {
      resolveFirebaseRuntimeConfig({ VITE_FIREBASE_EMULATORS: "true", VITE_FIREBASE_PROJECT_ID: projectId })
    } catch (error) {
      assert(error.message.includes(`VITE_FIREBASE_PROJECT_ID=${EXPECTED_PROJECT_ID}`), `Unexpected fail-closed error: ${error.message}`)
      continue
    }
    throw new Error(`Emulator mode accepted an invalid project ID: ${String(projectId)}`)
  }
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null || !child.pid) return
  if (process.platform === "win32") {
    const result = spawnSync("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" })
    if (result.error) throw result.error
  } else {
    child.kill("SIGTERM")
  }
  if (child.exitCode === null && child.signalCode === null) {
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ])
  }
  if (child.exitCode === null && child.signalCode === null) throw new Error(`Vite process ${child.pid} did not terminate`)
}

async function configureLocalOnlyContext(browser, options = {}) {
  const blocked = []
  const blockedWebSockets = []
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
  await context.routeWebSocket((url) => {
    const shouldBlock = !LOCAL_HOSTS.has(url.hostname)
    if (shouldBlock) blockedWebSockets.push(url.href)
    return shouldBlock
  }, (webSocketRoute) => webSocketRoute.close({ code: 1008, reason: "Non-loopback network disabled in E2E" }))
  return { blocked, blockedWebSockets, completedNonLocal, context, requests }
}

async function loginThroughMoneyMind(page, email, password, expectedUid) {
  // The first Vite request can spend tens of seconds optimizing dependencies.
  // Wait only for the local HTML response here; the form assertion below is
  // the readiness check for the actual application, with a useful body dump.
  await page.goto(`${BASE_URL}/#login`, { waitUntil: "commit", timeout: 30_000 })
  const form = page.locator("form.auth-card")
  try {
    await form.waitFor({ timeout: 60_000 })
  } catch (error) {
    const body = await page.locator("body").innerText().catch(() => "<body unavailable>")
    throw new Error(`Money Mind login did not render at ${page.url()}. Body: ${body.slice(0, 1_000)}`, { cause: error })
  }
  await form.locator('input[type="email"]').fill(email)
  const passwordInput = form.locator('input[autocomplete="current-password"]')
  await passwordInput.fill(password)
  await form.locator("button.auth-submit").waitFor({ state: "visible", timeout: 10_000 })
  // Submit through the real form's keyboard path. This avoids a mouse-hover
  // transform race on the animated submit button without bypassing the UI.
  await passwordInput.press("Enter")
  await page.waitForFunction(async (uid) => {
    const { auth } = await import("/src/firebase.js")
    return auth.currentUser?.uid === uid
  }, expectedUid, { timeout: 20_000 })
  await page.getByTestId("v2-app").waitFor({ timeout: 20_000 })
}

async function openModule(page, module) {
  if (new URL(page.url()).hash === "#v2") await waitForSpatialOverview(page)
  const node = page.getByTestId(`spatial-node-${module.id}`)
  try {
    await node.waitFor({ state: "visible", timeout: 15_000 })
  } catch (error) {
    const diagnostic = await page.evaluate((moduleId) => {
      const target = document.querySelector(`[data-testid="spatial-node-${moduleId}"]`)
      const stage = document.querySelector('[data-testid="spatial-stage"]')
      const fallback = document.querySelector('[data-testid="v2-fallback"]')
      const style = target ? getComputedStyle(target) : null
      const rect = target?.getBoundingClientRect()
      return {
        hash: window.location.hash,
        readyState: document.readyState,
        appPresent: Boolean(document.querySelector('[data-testid="v2-app"]')),
        fallbackText: fallback?.innerText || null,
        stage: stage ? { contextState: stage.dataset.contextState, sceneState: stage.dataset.sceneState, width: stage.clientWidth, height: stage.clientHeight } : null,
        node: target ? { text: target.innerText, display: style.display, visibility: style.visibility, opacity: style.opacity, width: rect.width, height: rect.height, x: Math.round(rect.x), y: Math.round(rect.y) } : null,
      }
    }, module.id).catch((diagnosticError) => ({ diagnosticError: diagnosticError.message }))
    throw new Error(`Spatial module node ${module.id} did not become visible. Browser state: ${JSON.stringify(diagnostic)}`, { cause: error })
  }
  await node.click()
  await page.getByTestId("v2-active-module").filter({ hasText: module.label }).waitFor()
}

async function verifyWorkspaceHeading(page, route) {
  if (route === "dashboard") {
    await page.getByText("Financial overview", { exact: true }).waitFor({ timeout: 15_000 })
    await page.getByRole("heading", { name: /^Welcome back/ }).waitFor()
    return
  }
  const title = pageInfo[route]?.title
  assert(title, `No existing V1 page title is registered for route ${route}`)
  // Some workspace titles contain a nested PageInfo button, which becomes part
  // of the accessible heading name. Assert the rendered title text itself.
  await page.getByText(title, { exact: true }).first().waitFor({ timeout: 15_000 })
}

async function assertClassicWorkspaceBridge(page, width, height) {
  await page.setViewportSize({ width, height })
  const bridge = page.getByTestId("classic-mode-bridge")
  await bridge.waitFor({ state: "visible", timeout: 10_000 })
  await bridge.getByRole("button", { name: "Return to Spatial overview", exact: true }).waitFor({ state: "visible" })
  const bridgeBox = await bridge.boundingBox()
  const buttonBox = await bridge.getByTestId("v2-return-from-classic").boundingBox()
  assert(bridgeBox && bridgeBox.x >= 0 && bridgeBox.y >= 0 && bridgeBox.x + bridgeBox.width <= width + 1, `Classic mode bridge is outside ${width}x${height}: ${JSON.stringify(bridgeBox)}`)
  assert(buttonBox && buttonBox.height >= 44 && buttonBox.x >= bridgeBox.x && buttonBox.x + buttonBox.width <= bridgeBox.x + bridgeBox.width + 1, `Classic return target is too small or outside its bridge at ${width}x${height}: ${JSON.stringify(buttonBox)}`)

  const headingBox = await page.getByRole("heading", { level: 1 }).first().boundingBox()
  assert(headingBox && headingBox.y >= bridgeBox.y + bridgeBox.height - 1, `Classic workspace heading overlaps its mode bridge at ${width}x${height}`)
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  assert(!horizontalOverflow, `Classic workspace has horizontal overflow at ${width}x${height}`)

  const summary = page.locator('[aria-label="Financial summary"]')
  if (await summary.count()) {
    const summaryCards = await summary.locator("article").all()
    for (const card of summaryCards) {
      const cardBox = await card.boundingBox()
      assert(cardBox, `Financial summary card has no bounds at ${width}x${height}`)
      const overlapX = buttonBox.x < cardBox.x + cardBox.width && buttonBox.x + buttonBox.width > cardBox.x
      const overlapY = buttonBox.y < cardBox.y + cardBox.height && buttonBox.y + buttonBox.height > cardBox.y
      assert(!(overlapX && overlapY), `Classic return action obscures a financial summary card at ${width}x${height}`)
    }
  }
}

async function verifyClassicWorkspaceResponsiveBridge(page) {
  await page.goto(`${BASE_URL}/#workspace/dashboard/dashboard/overview`, { waitUntil: "commit" })
  await verifyWorkspaceHeading(page, "dashboard")
  for (const [width, height] of [[320, 568], [375, 667], [728, 446], [768, 1024], [844, 390], [1024, 768], [1440, 900], [1920, 1080]]) {
    await assertClassicWorkspaceBridge(page, width, height)
  }

  // Browser zoom is not exposed by Playwright's viewport API. Exercise both
  // the CSS zoom proxy and the corresponding effective CSS viewport sizes;
  // media-query behavior is therefore covered without changing host Chrome.
  for (const [zoom, width, height] of [["2", 720, 450], ["4", 360, 225]]) {
    await page.setViewportSize({ width, height })
    await page.evaluate((value) => { document.documentElement.style.zoom = value }, zoom)
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    const button = page.getByTestId("v2-return-from-classic")
    const buttonBox = await button.boundingBox()
    const summary = page.locator('[aria-label="Financial summary"]')
    const summaryBox = await summary.boundingBox()
    assert(!horizontalOverflow, `Classic workspace has horizontal overflow under the ${Number(zoom) * 100}% zoom proxy (${width}x${height})`)
    assert(buttonBox && summaryBox && (buttonBox.y + buttonBox.height <= summaryBox.y || buttonBox.y >= summaryBox.y + summaryBox.height), `Classic return action overlaps financial summary at ${Number(zoom) * 100}% zoom`)
    await page.evaluate(() => { document.documentElement.style.zoom = "" })
  }

  await page.getByTestId("v2-return-from-classic").click()
  await page.getByTestId("v2-app").waitFor({ timeout: 20_000 })
  await page.waitForFunction(() => window.location.hash === "#v2/dashboard/overview")
}

async function returnToSpatial(page, expectedHash) {
  await page.getByTestId("v2-return-from-classic").click()
  await page.getByTestId("v2-app").waitFor({ timeout: 20_000 })
  await page.waitForFunction((hash) => window.location.hash === hash, expectedHash)
}

async function waitForSpatialOverview(page) {
  const stage = page.getByTestId("spatial-stage")
  await stage.waitFor({ state: "visible", timeout: 20_000 })
  try {
    await page.waitForFunction(() => {
      const current = document.querySelector('[data-testid="spatial-stage"]')
      return current?.dataset.sceneState === "overview" && current.dataset.activeTransition !== "overview-entry"
    }, null, { timeout: 15_000 })
  } catch (error) {
    const state = await stage.evaluate((element) => ({
      sceneState: element.dataset.sceneState,
      activeTransition: element.dataset.activeTransition,
      contextState: element.dataset.contextState,
    })).catch((diagnosticError) => ({ diagnosticError: diagnosticError.message }))
    throw new Error(`Spatial Core did not settle to its overview state: ${JSON.stringify(state)}`, { cause: error })
  }
}

async function exerciseRegisteredWorkspaces(page) {
  const cases = MODULE_REGISTRY.flatMap((module) => module.submodules.map((submodule) => ({ module, submodule })))
  for (const { module, submodule } of cases) {
    if (!windowHashIsModule(page.url(), module.id)) await openModule(page, module)
    const button = page.getByTestId(`v2-submodule-${submodule.id}`)
    await button.waitFor({ state: "visible", timeout: 10_000 })
    await button.click()
    if (submodule.destination.kind === "action") {
      assert(submodule.destination.action === "money-ai", `Unrecognized registered action: ${submodule.destination.action}`)
      await page.getByRole("dialog", { name: "Money AI" }).waitFor({ state: "visible", timeout: 15_000 })
      assert(new URL(page.url()).hash === `#workspace/action/${module.id}/${submodule.id}`, `Money AI route did not activate for ${module.id}/${submodule.id}`)
      await page.keyboard.press("Escape")
    } else {
      await verifyWorkspaceHeading(page, submodule.destination.route)
      const expectedHash = `#workspace/${submodule.destination.route}/${module.id}/${submodule.id}`
      assert(new URL(page.url()).hash === expectedHash, `Workspace route mismatch for ${module.id}/${submodule.id}: ${page.url()}`)
    }
    await returnToSpatial(page, `#v2/${module.id}/${submodule.id}`)
  }
}

function windowHashIsModule(url, moduleId) {
  return new URL(url).hash.startsWith(`#v2/${moduleId}`)
}

function isProductionFirebaseEndpoint(rawUrl) {
  const hostname = new URL(rawUrl).hostname.toLowerCase()
  return hostname === "identitytoolkit.googleapis.com"
    || hostname === "securetoken.googleapis.com"
    || hostname === "firestore.googleapis.com"
    || hostname === "firebaseinstallations.googleapis.com"
    || hostname === "firebasestorage.googleapis.com"
    || hostname.endsWith(".firebaseio.com")
    || hostname.endsWith(".firebaseapp.com")
    || hostname.endsWith(".firebasestorage.app")
    || hostname.endsWith(".cloudfunctions.net")
    || hostname.includes("money-mind-90176")
}

async function assertViewportNavigation(page, width, height) {
  await page.setViewportSize({ width, height })
  if (!windowHashIsModule(page.url(), "money-movement")) await openModule(page, MODULE_REGISTRY.find((module) => module.id === "money-movement"))
  const panel = page.getByTestId("v2-context")
  await panel.waitFor({ state: "visible" })
  const panelBox = await panel.boundingBox()
  assert(panelBox && panelBox.x >= 0 && panelBox.y >= 0 && panelBox.x + panelBox.width <= width + 1 && panelBox.y + panelBox.height <= height + 1, `Spatial navigation panel is outside ${width}x${height}: ${JSON.stringify(panelBox)}`)
  const transactions = page.getByTestId("v2-submodule-transactions")
  await transactions.waitFor({ state: "visible" })
  const transactionBox = await transactions.boundingBox()
  assert(transactionBox && transactionBox.x >= 0 && transactionBox.y >= 0 && transactionBox.x + transactionBox.width <= width + 1 && transactionBox.y + transactionBox.height <= height + 1, `Transactions navigation target is outside ${width}x${height}: ${JSON.stringify(transactionBox)}`)
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  assert(!horizontalOverflow, `Document has horizontal overflow at ${width}x${height}`)
  await transactions.click()
  await verifyWorkspaceHeading(page, "transactions")
  await returnToSpatial(page, "#v2/money-movement/transactions")
  const backToCore = page.getByTestId("v2-back-to-core")
  if (await backToCore.isVisible()) {
    await backToCore.click()
    await page.getByText("Money Mind Core", { exact: true }).waitFor()
  }
}

async function assertSubmoduleTargetsDoNotOverlap(page, module) {
  await openModule(page, module)
  const buttons = await page.locator(".v2-context__submodules button").all()
  const boxes = []
  for (const button of buttons) {
    const box = await button.boundingBox()
    assert(box, `Submodule target has no visible bounds in ${module.label}`)
    boxes.push(box)
  }
  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      const horizontalIntersection = Math.min(boxes[left].x + boxes[left].width, boxes[right].x + boxes[right].width) - Math.max(boxes[left].x, boxes[right].x)
      const verticalIntersection = Math.min(boxes[left].y + boxes[left].height, boxes[right].y + boxes[right].height) - Math.max(boxes[left].y, boxes[right].y)
      assert(horizontalIntersection <= 0 || verticalIntersection <= 0, `Submodule hit targets overlap in ${module.label}: ${left} and ${right}`)
    }
  }
  await page.getByTestId("v2-back-to-core").click()
  await page.getByText("Money Mind Core", { exact: true }).waitFor()
}

async function exerciseKeyboardAndTouch(page, browser, email, password, uid, lanes) {
  const coreButton = page.getByTestId("v2-back-to-core")
  if (await coreButton.isVisible()) await coreButton.click()
  await page.getByText("Money Mind Core", { exact: true }).waitFor()

  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.getByTestId("v2-app").waitFor({ timeout: 20_000 })
  await waitForSpatialOverview(page)
  const reducedMotionNode = page.getByTestId("spatial-node-money-movement")
  const reducedPreference = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  assert(reducedPreference, "The browser did not enable prefers-reduced-motion")
  await reducedMotionNode.click()
  await page.waitForFunction(() => document.querySelector('[data-testid="spatial-stage"]')?.dataset.activeTransition === "select-node")
  const reducedTransitionDuration = await reducedMotionNode.evaluate((element) => getComputedStyle(element).getPropertyValue("--motion-entry-duration").trim())
  assert(reducedTransitionDuration === "260ms", `Reduced-motion runtime selection duration was unexpected: ${reducedTransitionDuration}`)
  await page.waitForFunction(() => document.querySelector('[data-testid="spatial-stage"]')?.dataset.sceneState === "focused")
  await page.getByTestId("v2-back-to-core").click()
  await page.getByText("Money Mind Core", { exact: true }).waitFor()
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.getByTestId("v2-app").waitFor({ timeout: 20_000 })
  await waitForSpatialOverview(page)
  const movement = page.getByTestId("spatial-node-money-movement")
  await movement.focus()
  assert(await movement.evaluate((element) => document.activeElement === element), "Money Movement spatial node could not receive keyboard focus")
  await page.keyboard.press("Enter")
  await page.getByTestId("v2-active-module").filter({ hasText: "Money Movement" }).waitFor()
  const transactions = page.getByTestId("v2-submodule-transactions")
  await transactions.focus()
  await page.keyboard.press("Enter")
  await verifyWorkspaceHeading(page, "transactions")
  await returnToSpatial(page, "#v2/money-movement/transactions")
  await page.getByTestId("v2-back-to-core").click()
  await page.getByText("Money Mind Core", { exact: true }).waitFor()

  const touchLane = await configureLocalOnlyContext(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  lanes.push(touchLane)
  const touchPage = await touchLane.context.newPage()
  await loginThroughMoneyMind(touchPage, email, password, uid)
  await touchPage.getByTestId("spatial-node-money-movement").tap()
  await touchPage.getByTestId("v2-active-module").filter({ hasText: "Money Movement" }).waitFor()
  await touchPage.getByTestId("v2-submodule-transactions").tap()
  await verifyWorkspaceHeading(touchPage, "transactions")
  await returnToSpatial(touchPage, "#v2/money-movement/transactions")
  await touchLane.context.close()
}

async function exerciseWebglFallback(browser, email, password, uid, lanes) {
  const fallbackLane = await configureLocalOnlyContext(browser)
  lanes.push(fallbackLane)
  const fallbackPage = await fallbackLane.context.newPage()
  await fallbackPage.addInitScript(() => {
    const nativeGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
      if (["webgl", "webgl2", "experimental-webgl"].includes(String(type).toLowerCase())) return null
      return nativeGetContext.call(this, type, ...args)
    }
  })
  await loginThroughMoneyMind(fallbackPage, email, password, uid)
  await fallbackPage.getByTestId("v2-fallback").waitFor({ timeout: 20_000 })
  await fallbackPage.getByTestId("v2-fallback-classic").click()
  await verifyWorkspaceHeading(fallbackPage, "dashboard")
  assert(new URL(fallbackPage.url()).hash === "#workspace/dashboard/dashboard/overview", "WebGL fallback did not open the existing Classic dashboard")
  await fallbackLane.context.close()
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
let result
let allLanes = []
const cleanupFailures = []
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`
const password = "Phase1G-Local-987!"
const documentId = `phase1g-${stamp}`

try {
  verifyFailClosedConfiguration()
  await requireEmulator(AUTH_URL, "Auth emulator")
  await requireEmulator(FIRESTORE_URL, "Firestore emulator")
  owner = await createUser(`phase1g-owner-${stamp}@example.test`, password)
  other = await createUser(`phase1g-other-${stamp}@example.test`, password)

  const vitePort = await findAvailablePort()
  BASE_URL = `http://127.0.0.1:${vitePort}`
  vite = startVite(runDirectory, { port: vitePort })
  let viteOutput = ""
  vite.stdout.on("data", (chunk) => { viteOutput += chunk.toString() })
  vite.stderr.on("data", (chunk) => { viteOutput += chunk.toString() })
  vite.once("exit", (code) => { if (code && code !== 0) process.stderr.write(viteOutput) })
  await waitForServer(BASE_URL)

  browser = await chromium.launch({ executablePath: chromePath, headless: true })
  const ownerLane = await configureLocalOnlyContext(browser)
  const otherLane = await configureLocalOnlyContext(browser)
  allLanes = [ownerLane, otherLane]
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
  const authEmulatorRequest = ownerLane.requests.some((requestUrl) => {
    const url = new URL(requestUrl)
    return url.hostname === "127.0.0.1" && url.port === "9099" && url.pathname.includes("identitytoolkit.googleapis.com")
  })
  assert(authEmulatorRequest, "Money Mind authentication did not issue requests to 127.0.0.1:9099")
  const ownWrite = await firestoreOperation(ownerPage, "write", { uid: owner.localId, documentId, data: { owner: "A", synthetic: true } })
  assert(ownWrite.uid === owner.localId && ownWrite.projectId === EXPECTED_PROJECT_ID, "User A did not write through the isolated emulator project")
  const ownRead = await firestoreOperation(ownerPage, "read", { uid: owner.localId, documentId })
  assert(ownRead.exists && ownRead.data.owner === "A", "User A could not read authorized data")
  const firestoreEmulatorRequest = ownerLane.requests.some((requestUrl) => {
    const url = new URL(requestUrl)
    const requestTarget = `${url.pathname}${url.search}`
    return url.hostname === "127.0.0.1" && url.port === "8080" && requestTarget.includes("demo-money-mind-e2e")
  })
  assert(firestoreEmulatorRequest, "Money Mind Firestore did not issue requests to 127.0.0.1:8080")

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
  await exerciseRegisteredWorkspaces(ownerPage)
  await verifyClassicWorkspaceResponsiveBridge(ownerPage)

  // Exercise the acceptance path with real browser history: Core -> module ->
  // Transactions -> return to spatial selection, then Back/Forward and reload.
  await ownerPage.getByTestId("v2-back-to-core").click()
  await ownerPage.getByText("Money Mind Core", { exact: true }).waitFor()

  // Canonical deep links hydrate the existing workspace directly, while a
  // malformed/unknown deep link fails closed back to the spatial core.
  await ownerPage.goto(`${BASE_URL}/#workspace/transactions/money-movement/transactions`, { waitUntil: "commit" })
  await verifyWorkspaceHeading(ownerPage, "transactions")
  assert(new URL(ownerPage.url()).hash === "#workspace/transactions/money-movement/transactions", "Canonical workspace deep link was not preserved")
  await ownerPage.reload({ waitUntil: "commit" })
  await verifyWorkspaceHeading(ownerPage, "transactions")
  await returnToSpatial(ownerPage, "#v2/money-movement/transactions")
  await ownerPage.goto(`${BASE_URL}/#workspace/unknown/money-movement/transactions`, { waitUntil: "commit" })
  await ownerPage.getByTestId("v2-app").waitFor({ timeout: 20_000 })
  await ownerPage.waitForFunction(() => window.location.hash === "#v2")

  await exerciseKeyboardAndTouch(ownerPage, browser, owner.email, password, owner.localId, allLanes)
  await exerciseWebglFallback(browser, owner.email, password, owner.localId, allLanes)

  await openModule(ownerPage, MODULE_REGISTRY.find((module) => module.id === "money-movement"))
  await ownerPage.getByTestId("v2-submodule-transactions").click()
  await verifyWorkspaceHeading(ownerPage, "transactions")
  await returnToSpatial(ownerPage, "#v2/money-movement/transactions")
  await ownerPage.goBack()
  await verifyWorkspaceHeading(ownerPage, "transactions")
  assert(new URL(ownerPage.url()).hash === "#workspace/transactions/money-movement/transactions", `Back navigation missed Transactions: ${ownerPage.url()}`)
  await ownerPage.goForward()
  await ownerPage.getByTestId("v2-app").waitFor()
  assert(new URL(ownerPage.url()).hash === "#v2/money-movement/transactions", `Forward navigation missed the spatial return state: ${ownerPage.url()}`)
  await ownerPage.reload({ waitUntil: "commit" })
  await ownerPage.getByTestId("v2-app").waitFor({ timeout: 20_000 })
  await ownerPage.getByTestId("v2-active-module").filter({ hasText: "Money Movement" }).waitFor()
  await ownerPage.getByTestId("v2-submodule-transactions").waitFor()

  const viewports = [[320, 568], [375, 667], [728, 446], [390, 844], [844, 390], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]
  for (const [width, height] of viewports) {
    await assertViewportNavigation(ownerPage, width, height)
    await assertSubmoduleTargetsDoNotOverlap(ownerPage, MODULE_REGISTRY.find((module) => module.id === "wealth-building"))
  }

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
  owner = null
  await deleteUser(other.idToken)
  other = null

  assert(allLanes.every((lane) => lane.completedNonLocal.length === 0), "A browser request reached a non-loopback endpoint")
  assert(allLanes.every((lane) => lane.blockedWebSockets.length === 0), "A browser attempted a non-loopback WebSocket connection")
  const blockedProductionFirebase = [...new Set(allLanes.flatMap((lane) => lane.blocked).filter(isProductionFirebaseEndpoint))]
  assert(blockedProductionFirebase.length === 0, `E2E configuration attempted production Firebase endpoints: ${blockedProductionFirebase.join(", ")}`)
  result = {
    result: "PASS",
    projectId: EXPECTED_PROJECT_ID,
    auth: { actualLogin: true, userA: ownerUid, userB: otherUid, signOut: true },
    rules: { ownerReadWrite: true, crossUserReadDenied: true, crossUserWriteDenied: true, unauthenticatedReadWriteDenied: true },
    functional: { coreToAllRegisteredWorkspaces: true, moneyAiAction: true, coreToTransactionsToV2: true, backForward: true, deepLinks: true, refresh: true, keyboard: true, touch: true, reducedMotion: true, webglFallback: true, noOverlappingSubmoduleTargets: true, responsiveViewports: [[1440, 900], [390, 844], [844, 390], [768, 1024], [1024, 768]] },
    cleanup: { firestoreDocuments: true, authUsers: true },
    isolation: { wrongProjectFailsClosed: true, functionsRoutedToLoopback: true },
    network: { completedNonLoopback: 0, blockedAttempts: [...new Set(allLanes.flatMap((lane) => lane.blocked))], blockedWebSockets: [...new Set(allLanes.flatMap((lane) => lane.blockedWebSockets))], blockedProductionFirebase },
  }
} finally {
  await browser?.close().catch((error) => cleanupFailures.push(`Browser cleanup: ${error.message}`))
  await stopProcess(vite).catch((error) => cleanupFailures.push(`Vite cleanup: ${error.message}`))
  if (owner?.idToken) await deleteEvidenceWithToken(owner, documentId).catch((error) => cleanupFailures.push(`User A Firestore cleanup: ${error.message}`))
  if (other?.idToken) await deleteEvidenceWithToken(other, documentId).catch((error) => cleanupFailures.push(`User B Firestore cleanup: ${error.message}`))
  if (owner?.idToken) await deleteUser(owner.idToken).catch((error) => cleanupFailures.push(`User A Auth cleanup: ${error.message}`))
  if (other?.idToken) await deleteUser(other.idToken).catch((error) => cleanupFailures.push(`User B Auth cleanup: ${error.message}`))
  await rm(runDirectory, { recursive: true, force: true }).catch((error) => cleanupFailures.push(`Temporary directory cleanup: ${error.message}`))
}

if (cleanupFailures.length) throw new Error(`E2E cleanup did not complete: ${cleanupFailures.join("; ")}`)
if (!result) throw new Error("E2E did not produce an acceptance result")
console.log(JSON.stringify(result, null, 2))
