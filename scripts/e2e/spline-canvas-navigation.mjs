import { spawn } from "node:child_process"
import { randomUUID } from "node:crypto"
import net from "node:net"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { chromium } from "playwright-core"
import { resolveFirebaseRuntimeConfig } from "../../src/core/firebase/runtimeConfig.js"

// These points are an explicit baseline for the current hosted export, not a
// claim that every pixel is covered. A changed layout must be reviewed rather
// than silently updating them to make the test pass.
const cases = [
  { name: "desktop", viewport: { width: 1280, height: 665 }, x: [0.2, 0.5, 0.95], left: 611, width: 172, y: [171, 251, 331, 411, 491] },
  { name: "mobile", viewport: { width: 390, height: 844 }, x: [0.2, 0.5, 0.95], left: 182, width: 79, y: [354, 390, 426, 463, 499], isMobile: true, hasTouch: true },
]
const modules = ["dashboard", "money-movement", "wealth-building", "intelligence", "settings"]
const project = "demo-money-mind-e2e"
const authUrl = "http://127.0.0.1:9099"
const localUrl = "http://127.0.0.1:4178"
const password = `Local-${randomUUID()}!`
const email = `spline-${randomUUID()}@example.invalid`
const failures = []
let passed = 0
let user
let vite
let browser
let artifactDir
let activePage
let activeCase
const evidence = { exportUrl: "https://prod.spline.design/9rBX2vm0PBZotKW0/scene.splinecode", cases: [], failures }

function assert(condition, message) { if (!condition) throw new Error(message) }
async function waitFor(url, label) {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).status < 500) return } catch { /* wait for local process */ }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error(`${label} unavailable at ${url}`)
}
async function authRequest(action, body) {
  const response = await fetch(`${authUrl}/identitytoolkit.googleapis.com/v1/accounts:${action}?key=local-only`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  })
  const payload = await response.json()
  assert(response.ok, `Auth emulator ${action} failed: ${payload.error?.message || response.status}`)
  return payload
}

try {
  const evidenceRoot = path.resolve("test-results/spline-canvas")
  await mkdir(evidenceRoot, { recursive: true })
  artifactDir = await mkdtemp(path.join(evidenceRoot, "run-"))
  const config = resolveFirebaseRuntimeConfig({ VITE_FIREBASE_EMULATORS: "true", VITE_FIREBASE_PROJECT_ID: project })
  assert(config.projectId === project, "Demo Firebase project is required")
  await waitFor(authUrl, "Auth emulator")
  await waitFor("http://127.0.0.1:8080", "Firestore emulator")
  await new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once("error", () => reject(new Error("Port 4178 is occupied; refusing to test an unknown server")))
    probe.listen(4178, "127.0.0.1", () => probe.close(resolve))
  })
  user = await authRequest("signUp", { email, password, returnSecureToken: true })
  vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4178", "--strictPort"], {
    env: { ...process.env, VITE_FIREBASE_EMULATORS: "true", VITE_FIREBASE_PROJECT_ID: project, VITE_V2_ENABLED: "true", VITE_V2_APP_SHELL: "true", VITE_V2_SPATIAL_UI: "true", VITE_V2_SPLINE: "true" },
    stdio: "ignore",
  })
  await waitFor(localUrl, "Vite")
  browser = await chromium.launch({ executablePath: process.env.SPLINE_TEST_BROWSER || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--use-angle=swiftshader", "--enable-webgl"] })
  for (const testCase of cases) {
    const context = await browser.newContext({ viewport: testCase.viewport, isMobile: !!testCase.isMobile, hasTouch: !!testCase.hasTouch, serviceWorkers: "block" })
    const unexpected = []
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url())
      if (process.env.SPLINE_TEST_SIMULATE_SCENE_FAILURE === "1" && route.request().url() === evidence.exportUrl) return route.abort("failed")
      if (["localhost", "127.0.0.1"].includes(url.hostname) || (url.protocol === "https:" && url.hostname === "prod.spline.design")) return route.continue()
      unexpected.push(`${url.protocol}//${url.host}`)
      return route.abort()
    })
    await context.routeWebSocket((url) => !["localhost", "127.0.0.1"].includes(url.hostname), (socket) => {
      unexpected.push(`websocket:${socket.url}`)
      socket.close({ code: 1008, reason: "Non-local socket disabled in canvas test" })
    })
    const page = await context.newPage()
    activePage = page
    activeCase = testCase.name
    const record = { name: testCase.name, viewport: testCase.viewport, screenshot: null, sceneResponse: null, sceneFailure: null, samples: [], framing: null }
    record.simulatedSceneFailure = process.env.SPLINE_TEST_SIMULATE_SCENE_FAILURE === "1"
    evidence.cases.push(record)
    page.on("response", (response) => { if (response.url() === evidence.exportUrl) record.sceneResponse = response.status() })
    page.on("requestfailed", (request) => { if (request.url() === evidence.exportUrl) record.sceneFailure = request.failure()?.errorText || "request failed" })
    await page.goto(`${localUrl}/#login`, { waitUntil: "domcontentloaded" })
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[autocomplete="current-password"]').fill(password)
    await page.locator('input[autocomplete="current-password"]').press("Enter")
    await page.waitForFunction(() => document.querySelector('[data-testid="spline-stage"] canvas') || document.querySelector('.spline-fallback-notice'), null, { timeout: 60000 })
    if (await page.locator(".spline-fallback-notice").count()) throw new Error(`Spline fallback appeared; HTTP ${record.sceneResponse ?? "none"}; ${record.sceneFailure ?? "no network error"}`)
    await page.locator('[data-testid="spline-stage"] canvas').waitFor({ state: "visible", timeout: 60000 })
    // The runtime's canvas becomes visible before the scene is fully rendered.
    await page.waitForTimeout(5000)
    if (testCase.isMobile && process.env.SPLINE_TEST_SIMULATE_MOBILE_FRAMING === "1") {
      await page.addStyleTag({ content: '[data-testid="spline-stage"] canvas { visibility: hidden !important; }' })
      record.simulatedMobileFramingFailure = true
    }
    const screenshotName = `${testCase.name}-overview.png`
    const screenshot = await page.screenshot({ path: path.join(artifactDir, screenshotName) })
    record.screenshot = screenshotName
    const marks = testCase.y.flatMap((y, index) => testCase.x.map((fraction) => ({ x: testCase.left + testCase.width * fraction, y, module: modules[index] })))
    const annotated = await page.evaluate(async ({ bytes, points }) => {
      const image = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: "image/png" }))
      const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height
      const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0)
      ctx.strokeStyle = "#ffdc36"; ctx.lineWidth = 2
      for (const point of points) { ctx.beginPath(); ctx.arc(point.x, point.y, 4, 0, Math.PI * 2); ctx.stroke() }
      return canvas.toDataURL("image/png").split(",")[1]
    }, { bytes: Array.from(screenshot), points: marks })
    record.annotatedScreenshot = `${testCase.name}-sample-points.png`
    await writeFile(path.join(artifactDir, record.annotatedScreenshot), Buffer.from(annotated, "base64"))
    assert(record.sceneResponse === 200 && !record.sceneFailure, `${testCase.name}: Spline export failed (HTTP ${record.sceneResponse ?? "none"}; ${record.sceneFailure ?? "no network error"})`)
    const fallback = await page.locator(".spline-fallback-notice").count()
    assert(!fallback, `${testCase.name}: Spline fallback is visible`)
    if (testCase.isMobile) {
      // Read the captured screenshot, not internal Spline/Three objects. These
      // broad regions detect gross shifts or clipping, not text legibility.
      record.framing = await page.evaluate(async (bytes) => {
        const image = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: "image/png" }))
        const canvas = document.createElement("canvas")
        canvas.width = image.width; canvas.height = image.height
        const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0)
        const data = ctx.getImageData(0, 0, image.width, image.height).data
        const count = (x1, y1, x2, y2) => {
          let n = 0
          for (let y = y1; y < y2; y += 2) for (let x = x1; x < x2; x += 2) {
            const i = (y * image.width + x) * 4
            if (data[i] < 135 && data[i + 1] > 60 && data[i + 2] > 65 && data[i + 1] > data[i] * 1.15) n++
          }
          return n
        }
        return { core: count(60, 375, 150, 470), modules: [338, 374, 410, 446, 482].map((y) => count(182, y, 261, y + 20)) }
      }, Array.from(screenshot))
      if (record.framing.core < 25 || record.framing.modules.some((count) => count < 25)) throw new Error(`expected core/module colour regions changed or are clipped; inspect ${record.screenshot}; fixed click points were not used`)
    }
    for (let index = 0; index < modules.length; index++) {
      for (const fraction of testCase.x) {
        if (new URL(page.url()).hash !== "#v2") {
          await page.getByRole("button", { name: "Money Mind Core", exact: true }).click()
          await page.waitForURL("**/#v2", { timeout: 5000 })
        }
        const x = testCase.left + testCase.width * fraction
        const y = testCase.y[index]
        if (testCase.hasTouch) await page.touchscreen.tap(x, y)
        else await page.mouse.click(x, y)
        const expected = `#v2/${modules[index]}`
        try { await page.waitForURL((url) => url.hash === expected, { timeout: 2500 }); passed++; record.samples.push({ module: modules[index], x, y, expected, actual: new URL(page.url()).hash, passed: true }) }
        catch { const actual = new URL(page.url()).hash; record.samples.push({ module: modules[index], x, y, expected, actual, passed: false }); failures.push(`${testCase.name} ${modules[index]} x=${fraction}: expected ${expected}, got ${actual}`) }
      }
    }
    if (unexpected.length) console.log(`${testCase.name}: blocked external requests: ${[...new Set(unexpected)].join(", ")}`)
    if (unexpected.some((url) => /(?:firestore|identitytoolkit|securetoken|firebaseio)\.googleapis\.com|firebaseio\.com/.test(url))) failures.push(`${testCase.name}: attempted production Firebase access`)
    await context.close()
    activePage = null
  }
} catch (error) {
  failures.push(`${activeCase || "SETUP"}: ${error.message}`)
  if (activePage && artifactDir) {
    try {
      const filename = `${activeCase}-failure.png`
      await activePage.screenshot({ path: path.join(artifactDir, filename) })
      const record = evidence.cases.find((entry) => entry.name === activeCase)
      if (record) record.failureScreenshot = filename
    } catch { /* Preserve the original failure. */ }
  }
} finally {
  if (browser) await browser.close()
  if (vite) vite.kill()
  if (user?.idToken) {
    try { await authRequest("delete", { idToken: user.idToken }) }
    catch (error) { failures.push(`CLEANUP: ${error.message}`) }
  }
  if (artifactDir) {
    await writeFile(path.join(artifactDir, "report.json"), JSON.stringify({ ...evidence, passed }, null, 2))
    console.log(`Evidence: ${artifactDir}`)
  }
}
if (failures.length) {
  console.error(`Spline canvas navigation: FAILED (${passed} passed, ${failures.length} failures)\n${failures.join("\n")}`)
  process.exitCode = 1
} else {
  console.log("Spline canvas navigation: 30 sampled canvas points passed")
}
