import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { chromium } from "playwright-core"

const BASE_URL = "http://127.0.0.1:4178"
const SPATIAL_URL = `${BASE_URL}/#spatial`
const NODE_IDS = ["income", "investments", "assets", "debt", "expenses", "savings"]
const VIEWPORTS = [
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
  { name: "laptop-1366x768", width: 1366, height: 768 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-390x844", width: 390, height: 844 },
]

const SCREENSHOT_DIR = path.resolve("docs/v2/validation/screenshots/layer-3")
const REPORT_PATH = path.resolve("docs/v2/validation/layer-3-harness-report.json")

const KNOWN_WARNING_PATTERNS = [
  /THREE\.Clock/i,
  /fonts\.googleapis\.com/i,
]

const RESULTS = {
  initialization: false,
  hover: false,
  selection: false,
  deselection: false,
  switching: false,
  rapidInterruption: false,
  keyboard: false,
  cameraFocus: false,
  cameraReset: false,
  full: false,
  reduced: false,
  minimal: false,
  off: false,
  responsive: {},
  console: false,
  webglFallback: false,
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // retry
    }
    await wait(250)
  }
  throw new Error(`Server did not become reachable: ${url}`)
}

function resolveChromeExecutable() {
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ]
  const executablePath = candidates.find((candidate) => existsSync(candidate))
  if (!executablePath) throw new Error("No Chrome/Edge executable found for Playwright harness")
  return executablePath
}

function startDevServer() {
  const env = {
    ...process.env,
    VITE_V2_ENABLED: "true",
    VITE_V2_SPATIAL_UI: "true",
    VITE_V2_AI: "false",
  }
  const devProcess = process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev -- --host 127.0.0.1 --port 4178"], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env,
    })
    : spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4178"], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env,
    })

  let output = ""
  devProcess.stdout.on("data", (chunk) => {
    output += chunk.toString()
  })
  devProcess.stderr.on("data", (chunk) => {
    output += chunk.toString()
  })

  return { devProcess, getOutput: () => output }
}

async function stopDevServer(devProcess) {
  if (!devProcess || devProcess.killed) return
  devProcess.kill("SIGTERM")
  await wait(300)
  if (!devProcess.killed) devProcess.kill("SIGKILL")
}

async function waitForScene(page) {
  await page.getByRole("heading", { name: "Spatial Financial Workspace" }).waitFor({ timeout: 20000 })
  await page.locator("canvas").first().waitFor({ timeout: 20000 })
  await page.waitForFunction(() => document.querySelector('[data-testid="spatial-stage"]')?.dataset.contextState === "ready")
}

async function waitForSceneState(page, targetState, timeout = 3000) {
  await page.waitForFunction(
    (state) => document.querySelector('[data-testid="spatial-stage"]')?.dataset.sceneState === state,
    targetState,
    { timeout },
  )
}

async function currentSelectedNode(page) {
  return page.evaluate(() => {
    const active = document.querySelector('[data-testid^="spatial-node-"][aria-pressed="true"]')
    return active?.getAttribute("data-testid")?.replace("spatial-node-", "") ?? null
  })
}

async function noHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
}

async function tabTo(page, testId, maxTabs = 40) {
  for (let i = 0; i < maxTabs; i += 1) {
    const activeId = await page.evaluate(() => document.activeElement?.getAttribute("data-testid") || "")
    if (activeId === testId) return true
    await page.keyboard.press("Tab")
  }
  return false
}

function classifyConsole(messages, pageErrors) {
  const unexpectedErrors = messages.filter((entry) => entry.type === "error")
    .filter((entry) => !KNOWN_WARNING_PATTERNS.some((pattern) => pattern.test(entry.text)))
  const unexpectedWarnings = messages.filter((entry) => entry.type === "warning")
    .filter((entry) => !KNOWN_WARNING_PATTERNS.some((pattern) => pattern.test(entry.text)))
  return {
    unexpectedErrors,
    unexpectedWarnings,
    pageErrors,
    pass: unexpectedErrors.length === 0 && pageErrors.length === 0,
  }
}

async function createTrackedPage(context) {
  const page = await context.newPage()
  const consoleMessages = []
  const pageErrors = []
  page.on("console", (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() })
  })
  page.on("pageerror", (error) => {
    pageErrors.push(String(error))
  })
  return { page, consoleMessages, pageErrors }
}

async function runCoreInteractionSuite(page, policyId) {
  const policyUrl = `${BASE_URL}/?spatialMotion=${policyId}#spatial`
  await page.goto(policyUrl, { waitUntil: "domcontentloaded" })
  await waitForScene(page)

  if (policyId === "full") {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-overview.png") })
  }

  // Test 1 - Initialization
  const labels = await page.locator('[data-testid^="spatial-node-"]').count()
  const edges = await page.evaluate(() => {
    const canvas = document.querySelector("canvas")
    return Boolean(canvas)
  })
  assert(labels >= 7, "Expected core + 6 domain labels")
  assert(edges, "Canvas was not detected")

  // Test 2 - Hover
  for (const id of NODE_IDS) {
    const node = page.locator(`[data-testid="spatial-node-${id}"]`)
    await node.hover()
    await page.waitForFunction((nodeId) => {
      const el = document.querySelector(`[data-testid="spatial-node-${nodeId}"]`)
      return el?.classList.contains("is-hovered")
    }, id)
  }
  await page.mouse.move(2, 2)

  // Test 3 - Selection
  for (const id of NODE_IDS) {
    await page.locator(`[data-testid="spatial-node-${id}"]`).click()
    await waitForSceneState(page, "focused", 4000)
    const selectedId = await currentSelectedNode(page)
    assert(selectedId === id, `Expected selected node ${id}, received ${selectedId}`)
  }

  if (policyId === "full") {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-selected.png") })
  }

  // Test 4 - Deselection
  await page.locator('[data-testid="spatial-node-savings"]').click()
  await waitForSceneState(page, "overview", 4000)
  assert((await currentSelectedNode(page)) === null, "Expected no selected node after deselection")

  // Test 5 - Node switching
  for (const id of NODE_IDS) {
    await page.locator(`[data-testid="spatial-node-${id}"]`).click({ delay: 10 })
    await wait(60)
  }
  await waitForSceneState(page, "focused", 5000)
  assert((await currentSelectedNode(page)) === "savings", "Switching should settle on savings")

  if (policyId === "full") {
    await page.locator('[data-testid="spatial-node-income"]').click()
    await page.locator('[data-testid="spatial-node-investments"]').click({ delay: 5 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-switching.png") })
  }

  // Test 6 - Rapid interruption
  for (let round = 0; round < 3; round += 1) {
    await page.locator('[data-testid="spatial-node-assets"]').click({ delay: 5 })
    await page.locator('[data-testid="spatial-node-debt"]').click({ delay: 5 })
    await page.locator('[data-testid="spatial-node-savings"]').click({ delay: 5 })
    await page.locator('[data-testid="spatial-reset"]').click({ delay: 5 })
    await waitForSceneState(page, "overview", 5000)
  }

  for (let round = 0; round < 2; round += 1) {
    await page.locator('[data-testid="spatial-node-income"]').click({ delay: 5 })
    await page.locator('[data-testid="spatial-node-investments"]').click({ delay: 5 })
    await page.locator('[data-testid="spatial-node-debt"]').click({ delay: 5 })
    await page.locator('[data-testid="spatial-node-expenses"]').click({ delay: 5 })
    await waitForSceneState(page, "focused", 5000)
    assert((await currentSelectedNode(page)) === "expenses", "Rapid interruption should settle on expenses")
  }

  // Test 7 - Keyboard
  await page.keyboard.press("Home")
  assert(await tabTo(page, "spatial-node-income"), "Tab did not reach income label")
  await page.keyboard.press("Enter")
  await waitForSceneState(page, "focused", 4000)
  assert((await currentSelectedNode(page)) === "income", "Keyboard Enter should select income")

  assert(await tabTo(page, "spatial-node-investments"), "Tab did not reach investments label")
  await page.keyboard.press("Space")
  await waitForSceneState(page, "focused", 4000)
  assert((await currentSelectedNode(page)) === "investments", "Keyboard Space should select investments")
  if (policyId === "full") {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "keyboard-selected.png") })
  }

  assert(await tabTo(page, "spatial-reset"), "Tab did not reach reset button")
  await page.keyboard.press("Enter")
  await waitForSceneState(page, "overview", 4000)

  // Test 8/9 - Camera focus and reset via observable state
  await page.locator('[data-testid="spatial-node-assets"]').click()
  await waitForSceneState(page, "focused", 4000)
  assert((await currentSelectedNode(page)) === "assets", "Camera focus flow did not select assets")
  if (policyId === "full") {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-focused.png") })
  }

  await page.locator('[data-testid="spatial-reset"]').click()
  await waitForSceneState(page, "overview", 4000)
  assert((await currentSelectedNode(page)) === null, "Camera reset flow did not clear selection")

  if (policyId === "off") {
    await page.locator('[data-testid="spatial-node-debt"]').click()
    await waitForSceneState(page, "focused", 1000)
    const activeTransition = await page.evaluate(() => document.querySelector('[data-testid="spatial-stage"]')?.dataset.activeTransition)
    assert(activeTransition === "none", "Off motion should settle immediately")
  }

  await page.locator('select[aria-label="Rendering quality"]').selectOption("low")
  await page.locator('select[aria-label="Rendering quality"]').selectOption("medium")
  await page.locator('select[aria-label="Rendering quality"]').selectOption("high")
  await page.locator('select[aria-label="Rendering quality"]').selectOption("ultra")
  await page.locator('select[aria-label="Rendering quality"]').selectOption("auto")

  return true
}

async function runResponsiveSuite(browser) {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport })
    const { page, consoleMessages, pageErrors } = await createTrackedPage(context)
    await page.goto(`${BASE_URL}/?spatialMotion=full#spatial`, { waitUntil: "domcontentloaded" })
    await waitForScene(page)
    assert(await noHorizontalOverflow(page), `Horizontal overflow at ${viewport.name}`)
    await page.locator('[data-testid="spatial-node-assets"]').click()
    await waitForSceneState(page, "focused", 4000)
    await page.locator('[data-testid="spatial-reset"]').click()
    await waitForSceneState(page, "overview", 4000)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewport.name}.png`) })
    if (viewport.name === "mobile-390x844") {
      await page.locator('[data-testid="spatial-node-income"]').click()
      await waitForSceneState(page, "focused", 4000)
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "mobile-selected.png") })
    }
    const consoleStatus = classifyConsole(consoleMessages, pageErrors)
    assert(consoleStatus.pass, `Console/page errors in responsive suite for ${viewport.name}`)
    RESULTS.responsive[viewport.name] = true
    await context.close()
  }
}

async function runWebglFallback(browserExecutable) {
  const browser = await chromium.launch({
    executablePath: browserExecutable,
    headless: true,
    args: ["--disable-gpu", "--disable-webgl"],
  })
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await context.newPage()
  await page.goto(SPATIAL_URL, { waitUntil: "domcontentloaded" })
  await page.getByText("Spatial view unavailable").waitFor({ timeout: 12000 })
  assert((await page.locator("canvas").count()) === 0, "WebGL fallback should not render canvas")
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "webgl-fallback.png") })
  await context.close()
  await browser.close()
}

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true })

  const { devProcess, getOutput } = startDevServer()
  let browser
  try {
    await waitForServer(BASE_URL)
    const executablePath = resolveChromeExecutable()
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ["--disable-gpu", "--enable-webgl", "--use-angle=swiftshader"],
    })

    for (const [policyId, reducedMotion] of [["full", "no-preference"], ["reduced", "reduce"], ["minimal", "reduce"], ["off", "reduce"]]) {
      const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        reducedMotion,
      })
      const { page, consoleMessages, pageErrors } = await createTrackedPage(context)
      await runCoreInteractionSuite(page, policyId)
      const consoleStatus = classifyConsole(consoleMessages, pageErrors)
      assert(consoleStatus.pass, `Console/page errors for policy ${policyId}`)
      RESULTS.console = true
      RESULTS[policyId] = true
      await context.close()

      if (policyId === "full") {
        RESULTS.initialization = true
        RESULTS.hover = true
        RESULTS.selection = true
        RESULTS.deselection = true
        RESULTS.switching = true
        RESULTS.rapidInterruption = true
        RESULTS.keyboard = true
        RESULTS.cameraFocus = true
        RESULTS.cameraReset = true
      }

      if (policyId === "reduced") {
        const reducedContext = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: "reduce" })
        const reducedPage = await reducedContext.newPage()
        await reducedPage.goto(`${BASE_URL}/?spatialMotion=reduced#spatial`, { waitUntil: "domcontentloaded" })
        await waitForScene(reducedPage)
        await reducedPage.screenshot({ path: path.join(SCREENSHOT_DIR, "reduced-motion-state.png") })
        await reducedContext.close()
      }

      if (policyId === "off") {
        const offContext = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: "reduce" })
        const offPage = await offContext.newPage()
        await offPage.goto(`${BASE_URL}/?spatialMotion=off#spatial`, { waitUntil: "domcontentloaded" })
        await waitForScene(offPage)
        await offPage.screenshot({ path: path.join(SCREENSHOT_DIR, "off-motion-state.png") })
        await offContext.close()
      }
    }

    await runResponsiveSuite(browser)
    RESULTS.responsivePass = Object.keys(RESULTS.responsive).length === VIEWPORTS.length

    await browser.close()
    browser = null

    await runWebglFallback(resolveChromeExecutable())
    RESULTS.webglFallback = true

    const report = {
      timestamp: new Date().toISOString(),
      browser: resolveChromeExecutable(),
      playwrightCoreVersion: "1.62.1",
      baseUrl: BASE_URL,
      results: RESULTS,
      devServerOutputSnippet: getOutput().slice(-4000),
    }
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8")
    console.log(`Layer 3 browser acceptance report: ${REPORT_PATH}`)
  } catch (error) {
    if (browser) await browser.close()
    await writeFile(
      REPORT_PATH,
      `${JSON.stringify({ timestamp: new Date().toISOString(), results: RESULTS, error: String(error) }, null, 2)}\n`,
      "utf8",
    )
    throw error
  } finally {
    await stopDevServer(devProcess)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
