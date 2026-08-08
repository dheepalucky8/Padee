#!/usr/bin/env node
/**
 * Build a Padee debug APK on your laptop, install it on a USB-connected
 * phone, and launch the app.
 *
 * Needs only:
 *   - Node.js
 *   - Java JDK 17+
 *   - Android SDK command-line tools (downloaded automatically)
 *   - Phone with USB debugging enabled
 *
 * No Android Studio. No Expo account. No GitHub Actions.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const { pipeline } = require("node:stream/promises");
const { createWriteStream } = require("node:fs");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const isMac = process.platform === "darwin";

const CMDTOOLS_VERSION = "13114758";
const APP_ID = "com.padee.study";
const LAUNCH_ACTIVITY = `${APP_ID}/.MainActivity`;
const PACKAGES = [
  "platform-tools",
  "platforms;android-35",
  "build-tools;35.0.0",
  "ndk;27.1.12297006",
];

function log(msg) {
  console.log(msg);
}

function fail(msg, code = 1) {
  console.error(`\n${msg}`);
  process.exit(code);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: isWin,
    env: opts.env || process.env,
    cwd: opts.cwd || root,
  });
  if (result.error) {
    fail(`Failed to run ${cmd}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`Command failed (${result.status}): ${cmd} ${args.join(" ")}`, result.status);
  }
}

function runCapture(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: isWin,
    env: opts.env || process.env,
    cwd: opts.cwd || root,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function ensureJava() {
  const check = runCapture("java", ["-version"]);
  // java -version writes to stderr
  const out = `${check.stdout}\n${check.stderr}`;
  if (check.status !== 0) {
    fail(
      [
        "Java JDK is required (version 17 or newer).",
        "",
        "Install one of these, then reopen your terminal:",
        "  Windows:  winget install EclipseAdoptium.Temurin.17.JDK",
        "  Or download: https://adoptium.net/temurin/releases/?version=17",
        "",
        "Then run:  npm run build:android:local",
      ].join("\n")
    );
  }
  const match = out.match(/version "(\d+)/);
  const major = match ? Number(match[1]) : 0;
  if (major > 0 && major < 17) {
    fail(`Java ${major} found, but JDK 17+ is required. Install Temurin 17 and retry.`);
  }
  log(`✔ Java ready${major ? ` (JDK ${major})` : ""}`);
}

function ensureNodeModules() {
  if (!fs.existsSync(path.join(root, "node_modules", "expo"))) {
    log("→ npm install");
    run("npm", ["install"]);
  }
}

function sdkRoot() {
  return (
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    path.join(root, ".android-sdk")
  );
}

function cmdlineToolsUrl() {
  const osKey = isWin ? "win" : isMac ? "mac" : "linux";
  return `https://dl.google.com/android/repository/commandlinetools-${osKey}-${CMDTOOLS_VERSION}_latest.zip`;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(dest);
          download(res.headers.location, dest).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed (${res.statusCode}): ${url}`));
          return;
        }
        pipeline(res, file).then(resolve, reject);
      })
      .on("error", reject);
  });
}

function unzip(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  if (isWin) {
    run("powershell", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -Force -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}'`,
    ]);
    return;
  }
  run("unzip", ["-qo", zipPath, "-d", destDir]);
}

async function ensureAndroidSdk() {
  const rootSdk = sdkRoot();
  const latestTools = path.join(rootSdk, "cmdline-tools", "latest");
  const sdkmanager = path.join(
    latestTools,
    "bin",
    isWin ? "sdkmanager.bat" : "sdkmanager"
  );

  if (!fs.existsSync(sdkmanager)) {
    log("→ Downloading Android SDK command-line tools (no Android Studio)...");
    const tmpDir = path.join(root, ".android-sdk-tmp");
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    const zipPath = path.join(tmpDir, "cmdline-tools.zip");
    await download(cmdlineToolsUrl(), zipPath);
    unzip(zipPath, tmpDir);

    const extracted = path.join(tmpDir, "cmdline-tools");
    if (!fs.existsSync(extracted)) {
      fail("Android command-line tools zip layout was unexpected.");
    }

    fs.mkdirSync(path.join(rootSdk, "cmdline-tools"), { recursive: true });
    fs.rmSync(latestTools, { recursive: true, force: true });
    fs.renameSync(extracted, latestTools);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    log(`✔ SDK tools installed at ${rootSdk}`);
  } else {
    log(`✔ Android SDK tools found at ${rootSdk}`);
  }

  const platformTools = path.join(rootSdk, "platform-tools");
  const env = {
    ...process.env,
    ANDROID_HOME: rootSdk,
    ANDROID_SDK_ROOT: rootSdk,
    PATH: `${platformTools}${path.delimiter}${process.env.PATH || ""}`,
  };

  // Accept licenses non-interactively
  log("→ Accepting Android SDK licenses");
  const license = spawnSync(
    sdkmanager,
    ["--sdk_root=" + rootSdk, "--licenses"],
    {
      input: "y\n".repeat(100),
      encoding: "utf8",
      shell: isWin,
      env,
    }
  );
  if (license.status !== 0) {
    // Some sdkmanager versions return non-zero even after accepting; continue.
    log("  (license step finished with warnings — continuing)");
  }

  log("→ Installing Android platform / build-tools / NDK (first time is large)");
  run(sdkmanager, ["--sdk_root=" + rootSdk, ...PACKAGES], { env });

  return env;
}

function ensureAndroidProject(env) {
  const androidDir = path.join(root, "android");
  if (!fs.existsSync(path.join(androidDir, isWin ? "gradlew.bat" : "gradlew"))) {
    log("→ Generating native Android project (expo prebuild)");
    run("npx", ["expo", "prebuild", "--platform", "android", "--no-install"], {
      env: { ...env, CI: "1" },
    });
  } else {
    log("✔ Native Android project already present");
  }
}

function buildApk(env) {
  const androidDir = path.join(root, "android");
  const gradle = path.join(androidDir, isWin ? "gradlew.bat" : "gradlew");
  if (!isWin) {
    try {
      fs.chmodSync(gradle, 0o755);
    } catch {
      // ignore
    }
  }
  log("→ Building debug APK (this can take several minutes the first time)");
  run(gradle, ["assembleDebug", "--no-daemon"], { cwd: androidDir, env });
}

function adbBin(env) {
  const fromSdk = path.join(
    env.ANDROID_HOME || sdkRoot(),
    "platform-tools",
    isWin ? "adb.exe" : "adb"
  );
  return fs.existsSync(fromSdk) ? fromSdk : "adb";
}

function listDevices(env) {
  const adb = adbBin(env);
  const result = runCapture(adb, ["devices"], { env });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, status] = line.split(/\s+/);
      return { id, status };
    })
    .filter((d) => d.id && d.status);
}

function requirePhone(env) {
  const devices = listDevices(env);
  const ready = devices.filter((d) => d.status === "device");
  const unauthorized = devices.filter((d) => d.status === "unauthorized");

  if (ready.length > 0) {
    log(`✔ Phone connected: ${ready.map((d) => d.id).join(", ")}`);
    return ready[0].id;
  }

  if (unauthorized.length > 0) {
    fail(
      [
        "Phone is connected but USB debugging is not authorized.",
        "On your phone, tap Allow / OK on the USB debugging prompt, then run again:",
        "  npm run build:android:local",
      ].join("\n")
    );
  }

  fail(
    [
      "No phone detected. Connect your Android phone so the app can install and launch.",
      "",
      "On your phone:",
      "  1. Settings → About phone → tap Build number 7 times (Developer options)",
      "  2. Settings → Developer options → turn on USB debugging",
      "  3. Plug into this laptop with a USB cable",
      "  4. Choose File transfer / MTP if asked",
      "  5. Tap Allow on the USB debugging popup",
      "",
      "Then run:  npm run build:android:local",
    ].join("\n")
  );
}

function installAndLaunch(env, apk) {
  const adb = adbBin(env);
  const deviceId = requirePhone(env);

  log("→ Installing APK on phone");
  run(adb, ["-s", deviceId, "install", "-r", apk], { env });

  log("→ Launching Padee");
  run(
    adb,
    [
      "-s",
      deviceId,
      "shell",
      "am",
      "start",
      "-a",
      "android.intent.action.MAIN",
      "-c",
      "android.intent.category.LAUNCHER",
      "-n",
      LAUNCH_ACTIVITY,
    ],
    { env }
  );
}

async function main() {
  log("Padee local APK build → install → launch on phone");
  log("No Android Studio · No Expo account · No GitHub Actions\n");

  ensureJava();
  ensureNodeModules();
  const env = await ensureAndroidSdk();
  // Fail early if the phone is missing, before the long Gradle build.
  requirePhone(env);
  ensureAndroidProject(env);
  buildApk(env);

  const apk = path.join(
    root,
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    "debug",
    "app-debug.apk"
  );
  if (!fs.existsSync(apk)) {
    fail("Build finished but APK was not found.");
  }

  log("\n✔ APK ready:");
  log(apk);
  installAndLaunch(env, apk);
  log("\n✔ Padee should now be open on your phone.");
}

main().catch((err) => {
  fail(err && err.stack ? err.stack : String(err));
});
