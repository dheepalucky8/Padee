#!/usr/bin/env node
/**
 * Quick USB / adb authorization check for Padee local builds.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const sdkRoot =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.join(root, ".android-sdk");
const adb = path.join(sdkRoot, "platform-tools", isWin ? "adb.exe" : "adb");

if (!fs.existsSync(adb)) {
  console.error("adb not found yet. Run once: npm run build:android:local");
  console.error(`Looked in: ${adb}`);
  process.exit(1);
}

function run(args) {
  return spawnSync(adb, args, {
    encoding: "utf8",
    shell: false,
    env: {
      ...process.env,
      ANDROID_HOME: sdkRoot,
      ANDROID_SDK_ROOT: sdkRoot,
    },
  });
}

run(["kill-server"]);
run(["start-server"]);
const result = run(["devices", "-l"]);
const out = `${result.stdout || ""}${result.stderr || ""}`;
process.stdout.write(out);

const lines = out
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("List of devices"));

if (lines.some((l) => /\sdevice(\s|$)/.test(l))) {
  console.log("\n✔ Phone is authorized. Run: npm run build:android:local");
  process.exit(0);
}

if (lines.some((l) => /unauthorized/.test(l))) {
  console.log(
    [
      "",
      "Phone found, but NOT authorized.",
      "On the phone:",
      "  1. Unplug/replug USB",
      "  2. Tap Allow on \"Allow USB debugging?\"",
      "  3. If no popup: Developer options → Revoke USB debugging authorizations → replug",
      "  4. USB mode = File transfer / MTP",
      "",
      "Then run this check again: npm run android:devices",
    ].join("\n")
  );
  process.exit(2);
}

console.log(
  [
    "",
    "No phone detected.",
    "Enable USB debugging, plug in the phone, then run: npm run android:devices",
  ].join("\n")
);
process.exit(1);
