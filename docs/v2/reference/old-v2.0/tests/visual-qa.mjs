import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.MONEY_MIND_BASE_URL ?? "http://127.0.0.1:3000";
const outputDirectory = "test-results/design-system";
const viewports = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "laptop-1024", width: 1024, height: 900 },
  { name: "tablet-768", width: 768, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}/dev/design-system`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) throw new Error(`Horizontal overflow at ${viewport.name}`);
    await page.screenshot({ path: `${outputDirectory}/${viewport.name}.png`, fullPage: true });
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  await page.goto(`${baseUrl}/dev/design-system`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open dialog" }).click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const notificationButton = page.getByRole("button", { name: "Notifications" });
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  for (let index = 0; index < 30; index += 1) {
    await page.keyboard.press("Tab");
    if (await notificationButton.evaluate((element) => document.activeElement === element)) break;
  }
  if (!(await notificationButton.evaluate((element) => document.activeElement === element))) {
    throw new Error("Notifications control was not reachable by keyboard");
  }
  const focusOutline = await notificationButton.evaluate((element) => getComputedStyle(element).outlineStyle);
  if (focusOutline === "none") throw new Error("Focus indicator is not visible");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const transitionDuration = await notificationButton.evaluate((element) => getComputedStyle(element).transitionDuration);
  const durationSeconds = Number.parseFloat(transitionDuration);
  if (!Number.isFinite(durationSeconds) || durationSeconds > 0.001) {
    throw new Error(`Reduced-motion override is not active: ${transitionDuration}`);
  }
  await page.close();
} finally {
  await browser.close();
}

console.log("Visual QA passed at 1440, 1024, 768, and 390 pixels.");
