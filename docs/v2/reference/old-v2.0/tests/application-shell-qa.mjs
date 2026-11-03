import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseUrl=process.env.MONEY_MIND_BASE_URL??"http://127.0.0.1:3000";
const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
await mkdir("test-results/application-shell",{recursive:true});

async function assertNoOverflow(page,label){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);if(overflow)throw new Error(`Horizontal overflow at ${label}`);}

try {
  for(const viewport of [{name:"desktop-1440",width:1440,height:1000},{name:"laptop-1024",width:1024,height:900},{name:"tablet-768",width:768,height:900},{name:"mobile-390",width:390,height:844}]){
    const page=await browser.newPage({viewport});
    await page.goto(`${baseUrl}/dashboard`,{waitUntil:"networkidle"});
    await page.waitForURL("**/login?next=%2Fdashboard");
    await assertNoOverflow(page,viewport.name);
    await page.screenshot({path:`test-results/application-shell/${viewport.name}.png`});
    await page.close();
  }
} finally { await browser.close(); }
console.log("Application shell auth-boundary QA passed at 1440, 1024, 768, and 390 pixels.");
