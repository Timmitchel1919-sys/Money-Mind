import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const dist = resolve("dist")
const manifest = JSON.parse(readFileSync(resolve(dist, "manifest.webmanifest"), "utf8"))
assert.equal(manifest.display, "standalone")
assert.equal(manifest.start_url, "/")
for (const icon of manifest.icons) {
  const match = /^(\d+)x(\d+)$/.exec(icon.sizes)
  assert.ok(match, `Invalid icon size: ${icon.sizes}`)
  const bytes = readFileSync(resolve(dist, icon.src.replace(/^\//, "")))
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${icon.src} is not PNG`)
  assert.equal(bytes.readUInt32BE(16), Number(match[1]), `${icon.src} width`)
  assert.equal(bytes.readUInt32BE(20), Number(match[2]), `${icon.src} height`)
}
assert.ok(existsSync(resolve(dist, "apple-touch-icon.png")))
assert.ok(existsSync(resolve(dist, "sw.js")))
assert.match(readFileSync(resolve(dist, "index.html"), "utf8"), /registerSW\.js/)
assert.match(readFileSync(resolve(dist, "registerSW.js"), "utf8"), /serviceWorker\.register/)
console.log("PWA artifact checks passed (installation and offline behavior not tested).")
