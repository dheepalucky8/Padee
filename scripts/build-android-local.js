#!/usr/bin/env node
/**
 * Build a Padee debug APK on your laptop, install it on a USB-connected
 * phone, and launch the app.
 *
 * Needs only:
 *   - Node.js
 *   - Phone with USB debugging enabled
 *
 * Java JDK and Android SDK command-line tools are downloaded automatically.
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

function needsShell(cmd) {
  if (!isWin) return false;
  // Absolute .exe (adb/java) must NOT use shell — Windows drops args otherwise.
  if (path.isAbsolute(cmd) && /\.exe$/i.test(cmd)) return false;
  // npm/npx/gradlew are .cmd/.bat wrappers and need a shell on Windows.
  return true;
}

function run(cmd, args, opts = {}) {
  const shell = opts.shell ?? needsShell(cmd);
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell,
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
  const shell = opts.shell ?? needsShell(cmd);
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    shell,
    env: opts.env || process.env,
    cwd: opts.cwd || root,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function javaMajorFromOutput(out) {
  const match = String(out).match(/version "(\d+)/);
  return match ? Number(match[1]) : 0;
}

function probeJava(javaCmd, env) {
  const check = runCapture(javaCmd, ["-version"], { env });
  const out = `${check.stdout}\n${check.stderr}`;
  if (check.status !== 0) return null;
  const major = javaMajorFromOutput(out);
  if (major > 0 && major < 17) return null;
  return { major: major || 17, javaCmd };
}

function findJavaHomeCandidates() {
  const homes = [];
  if (process.env.JAVA_HOME) homes.push(process.env.JAVA_HOME);

  const localJdk = path.join(root, ".jdk");
  if (fs.existsSync(localJdk)) {
    for (const name of fs.readdirSync(localJdk)) {
      homes.push(path.join(localJdk, name));
    }
  }

  if (isWin) {
    const programFiles = [
      process.env["ProgramFiles"] || "C:\\Program Files",
      process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
      process.env.LOCALAPPDATA || "",
    ].filter(Boolean);

    const vendors = [
      "Eclipse Adoptium",
      "Microsoft",
      "Java",
      "Amazon Corretto",
      "Zulu",
      "Semeru",
    ];

    for (const base of programFiles) {
      for (const vendor of vendors) {
        const dir = path.join(base, vendor);
        if (!fs.existsSync(dir)) continue;
        for (const name of fs.readdirSync(dir)) {
          if (/jdk-?1?[7-9]|jdk-?[2-9]\d/i.test(name) || /jdk/i.test(name)) {
            homes.push(path.join(dir, name));
          }
        }
      }
    }
  }

  return homes;
}

function adoptiumOs() {
  if (isWin) return "windows";
  if (isMac) return "mac";
  return "linux";
}

function adoptiumArch() {
  const arch = process.arch;
  if (arch === "x64" || arch === "x86_64") return "x64";
  if (arch === "arm64") return "aarch64";
  return "x64";
}

function jdkDownloadUrl() {
  // Portable Temurin JDK 17 — no installer / no admin rights needed.
  return (
    "https://api.adoptium.net/v3/binary/latest/17/ga/" +
    `${adoptiumOs()}/${adoptiumArch()}/jdk/hotspot/normal/eclipse?project=jdk`
  );
}

function findJavaBinary(home) {
  const bin = path.join(home, "bin", isWin ? "java.exe" : "java");
  return fs.existsSync(bin) ? bin : null;
}

function findExtractedJdkHome(extractDir) {
  const stack = [extractDir];
  while (stack.length) {
    const dir = stack.pop();
    if (findJavaBinary(dir)) return dir;
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) stack.push(path.join(dir, entry.name));
    }
  }
  return null;
}

async function downloadPortableJdk() {
  const jdkRoot = path.join(root, ".jdk");
  const tmpDir = path.join(root, ".jdk-tmp");
  fs.mkdirSync(jdkRoot, { recursive: true });

  // Reuse a previous extract if a failed rename left the JDK in .jdk-tmp.
  let home = findExtractedJdkHome(tmpDir);
  if (!home) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });

    const archiveName = isWin ? "jdk17.zip" : "jdk17.tar.gz";
    const archivePath = path.join(tmpDir, archiveName);

    log("→ Downloading portable Java JDK 17 (one-time, no installer)...");
    await download(jdkDownloadUrl(), archivePath);

    log("→ Extracting JDK into .jdk/");
    if (isWin) {
      unzip(archivePath, tmpDir);
    } else {
      run("tar", ["-xzf", archivePath, "-C", tmpDir]);
    }

    home = findExtractedJdkHome(tmpDir);
    if (!home) {
      fail("Downloaded JDK archive, but could not find java inside it.");
    }
  } else {
    log("→ Found JDK left from a previous run; finishing install...");
  }

  const destName = path.basename(home);
  const dest = path.join(jdkRoot, destName);
  moveDir(home, dest);
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // Windows may keep a brief lock on the empty temp tree.
  }
  log(`✔ JDK installed at ${dest}`);
  return dest;
}

async function ensureJava() {
  // 1) java on PATH
  const onPath = probeJava("java", process.env);
  if (onPath) {
    log(`✔ Java ready (JDK ${onPath.major})`);
    return {};
  }

  // 2) known install locations / previous portable download
  for (const home of findJavaHomeCandidates()) {
    const javaBin = findJavaBinary(home);
    if (!javaBin) continue;
    const env = {
      JAVA_HOME: home,
      PATH: `${path.join(home, "bin")}${path.delimiter}${process.env.PATH || ""}`,
    };
    const probed = probeJava(javaBin, { ...process.env, ...env });
    if (probed) {
      log(`✔ Java ready (JDK ${probed.major}) at ${home}`);
      return env;
    }
  }

  // 3) download portable JDK into the project
  const home = await downloadPortableJdk();
  const env = {
    JAVA_HOME: home,
    PATH: `${path.join(home, "bin")}${path.delimiter}${process.env.PATH || ""}`,
  };
  const javaBin = findJavaBinary(home);
  const probed = probeJava(javaBin, { ...process.env, ...env });
  if (!probed) {
    fail("Portable JDK downloaded but java still does not run.");
  }
  log(`✔ Java ready (JDK ${probed.major})`);
  return env;
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
        const total = Number(res.headers["content-length"] || 0);
        let received = 0;
        let lastPct = -1;
        res.on("data", (chunk) => {
          received += chunk.length;
          if (!total) return;
          const pct = Math.floor((received / total) * 100);
          if (pct >= lastPct + 10) {
            lastPct = pct;
            process.stdout.write(`  download ${pct}%\r`);
          }
        });
        pipeline(res, file).then(() => {
          if (total) process.stdout.write("  download 100%\n");
          resolve();
        }, reject);
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

/**
 * Move a directory. On Windows, renameSync often fails with EPERM right after
 * Expand-Archive (files still locked), so fall back to copy + delete.
 */
function moveDir(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  try {
    fs.renameSync(src, dest);
    return;
  } catch (err) {
    if (!err || !["EPERM", "EACCES", "EBUSY", "EXDEV"].includes(err.code)) {
      throw err;
    }
  }

  fs.cpSync(src, dest, { recursive: true, force: true });
  // Best-effort cleanup; ignore if Windows still has a lock on temp files.
  try {
    fs.rmSync(src, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // leave temp dir; next run cleans .jdk-tmp / .android-sdk-tmp
  }
}

async function ensureAndroidSdk(baseEnv) {
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
    moveDir(extracted, latestTools);
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // ignore temp cleanup failures on Windows
    }
    log(`✔ SDK tools installed at ${rootSdk}`);
  } else {
    log(`✔ Android SDK tools found at ${rootSdk}`);
  }

  const platformTools = path.join(rootSdk, "platform-tools");
  const env = {
    ...process.env,
    ...baseEnv,
    ANDROID_HOME: rootSdk,
    ANDROID_SDK_ROOT: rootSdk,
    PATH: `${platformTools}${path.delimiter}${
      baseEnv.PATH || process.env.PATH || ""
    }`,
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
  // Release embeds the JS bundle so the phone can run without Metro/Expo Go.
  log("→ Building release APK with embedded app bundle (first time can take a while)");
  run(gradle, ["assembleRelease", "--no-daemon"], { cwd: androidDir, env });
}

function findReleaseApk() {
  const candidates = [
    path.join(root, "android", "app", "build", "outputs", "apk", "release", "app-release.apk"),
    path.join(root, "android", "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk"),
  ];
  for (const apk of candidates) {
    if (fs.existsSync(apk)) return apk;
  }
  // Fallback: any release apk under outputs
  const releaseDir = path.join(root, "android", "app", "build", "outputs", "apk", "release");
  if (!fs.existsSync(releaseDir)) return null;
  const found = fs
    .readdirSync(releaseDir)
    .filter((name) => name.endsWith(".apk"))
    .map((name) => path.join(releaseDir, name));
  return found[0] || null;
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

  log(`→ Using adb: ${adb}`);
  log("→ Installing APK on phone (replacing any older Padee build)");
  const install = runCapture(
    adb,
    ["-s", deviceId, "install", "-r", "-d", "-t", apk],
    { env }
  );
  const installOut = `${install.stdout}\n${install.stderr}`;
  process.stdout.write(installOut);
  if (install.status !== 0 || !/Success/i.test(installOut)) {
    fail(
      [
        "APK install on the phone failed.",
        "Check the phone screen for an install prompt and tap Allow / Install.",
        "Also confirm USB debugging is still authorized, then run again:",
        "  npm run build:android:local",
      ].join("\n")
    );
  }

  const verify = runCapture(
    adb,
    ["-s", deviceId, "shell", "pm", "path", APP_ID],
    { env }
  );
  if (verify.status !== 0 || !String(verify.stdout).includes("package:")) {
    fail(`Install reported success, but package ${APP_ID} was not found on the phone.`);
  }
  log(`✔ Installed: ${String(verify.stdout).trim()}`);

  log("→ Launching Padee on phone");
  const launch = runCapture(
    adb,
    [
      "-s",
      deviceId,
      "shell",
      "am",
      "start",
      "-n",
      LAUNCH_ACTIVITY,
    ],
    { env }
  );
  const launchOut = `${launch.stdout}\n${launch.stderr}`;
  process.stdout.write(launchOut);
  if (launch.status !== 0 || /Error/i.test(launchOut)) {
    // Fallback: monkey launcher intent
    run(
      adb,
      [
        "-s",
        deviceId,
        "shell",
        "monkey",
        "-p",
        APP_ID,
        "-c",
        "android.intent.category.LAUNCHER",
        "1",
      ],
      { env }
    );
  }
}

async function main() {
  log("Padee local APK build → install → launch on phone");
  log("Needs Node.js + USB phone only (JDK/SDK download automatically)\n");

  const javaEnv = await ensureJava();
  ensureNodeModules();
  const env = await ensureAndroidSdk(javaEnv);
  // Fail early if the phone is missing, before the long Gradle build.
  requirePhone(env);
  ensureAndroidProject(env);
  buildApk(env);

  const apk = findReleaseApk();
  if (!apk) {
    fail("Build finished but release APK was not found.");
  }

  log("\n✔ APK ready:");
  log(apk);
  installAndLaunch(env, apk);
  log("\n✔ Padee is installed and should be open on your phone.");
  log("Look for the app named Padee in your app drawer if it did not come to the front.");
}

main().catch((err) => {
  fail(err && err.stack ? err.stack : String(err));
});
