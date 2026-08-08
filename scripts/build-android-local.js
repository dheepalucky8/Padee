#!/usr/bin/env node
/**
 * Builds a debug APK with the local Android SDK.
 * No Expo account required.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const androidDir = path.join(root, "android");
const isWin = process.platform === "win32";
const gradle = path.join(androidDir, isWin ? "gradlew.bat" : "gradlew");

const result = spawnSync(gradle, ["assembleDebug"], {
  cwd: androidDir,
  stdio: "inherit",
  shell: isWin,
  env: process.env,
});

if (result.status !== 0) {
  console.error("\nAndroid build failed.");
  console.error("Install Android Studio + SDK Platform 35, then try again.");
  process.exit(result.status || 1);
}

const apk = path.join(
  androidDir,
  "app",
  "build",
  "outputs",
  "apk",
  "debug",
  "app-debug.apk"
);
console.log("\nAPK ready (no Expo account needed):");
console.log(apk);
console.log("\nCopy that file to your phone and install it.");
