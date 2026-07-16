---
description: Build Android release APK, then install to connected device via ADB and/or upload to Google Drive for phone download.
---

Build Android release APK. After the build succeeds, deliver it via whichever destination the user wants:
- **ADB install** — requires phone connected over USB with debugging enabled.
- **Google Drive upload** — no cable needed; user downloads it on the phone via the Drive app/site. Default choice when no device is connected or the user just wants a shareable build.

If the user doesn't specify, ask which they want (or do both).

## Environment setup (required every time — Bash tool does not inherit ~/.zprofile)

```
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home
ADB=/Users/mimi/Library/Android/sdk/platform-tools/adb
APK=android/app/build/outputs/apk/release/app-release.apk
DRIVE_ROOT=~/Library/CloudStorage/GoogleDrive-mimichild@gmail.com/我的雲端硬碟/SPARK-Builds
```

`DRIVE_ROOT` has one subfolder per SPARK project (`SPARKWEAR`, `SPARKFIT`, `SPARKNOTE`, `SPARKPLATE`, `SPARKSHAPE`). Use `$(basename "$PWD")` to pick the right one so this same command works unmodified if copied into another SPARK project's `.claude/commands/`.

**Important:** `我的雲端硬碟` is the Traditional-Chinese-localized folder name Google Drive for Desktop uses on this Mac (it is NOT literally "My Drive" in English) — always use the exact Chinese folder name above, or `find` it fresh with `find ~/Library/CloudStorage -maxdepth 1` if this account's localization ever changes.

## ⚠️ Mandatory: force-refresh the JS bundle before every release build

Since migrating to pnpm, plain `./gradlew assembleRelease` silently mis-detects `:app:createBundleReleaseJsAndAssets` as up-to-date even when `src/` has changed — Metro never runs, and you get a real "BUILD SUCCESSFUL" with an APK containing **stale JS** (verified by decoding the Hermes bundle and confirming old strings/missing new code). No error, no warning — it just ships old behavior. Root cause not fully diagnosed; presumed related to how pnpm's hoisted linker changed `node_modules` layout/mtimes.

**Do NOT "fix" this with `./gradlew clean`** — on these projects that breaks the C++/CMake autolinking build entirely (`clean` wipes `.cxx` intermediates, then CMake's `Android-autolinking.cmake` fails with `add_subdirectory given source ... which is not an existing directory` because the codegen output under `node_modules/<pkg>/android/build/generated/source/codegen/jni/` hasn't been regenerated yet — tested and confirmed this hard-fails the build).

**Correct fix — always run this first, from `android/`:**
```bash
export JAVA_HOME="/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home" && export PATH="$JAVA_HOME/bin:$PATH:/Users/mimi/Library/Android/sdk/platform-tools" && cd android && ./gradlew :app:createBundleReleaseJsAndAssets --rerun-tasks 2>&1
```
This forces Metro to actually re-bundle (you'll see "Bundler cache is empty, rebuilding" and a fresh module count) and updates the bundle file's mtime, so the normal build below correctly detects the change and repackages everything downstream.

## Steps

1. Run the bundle force-refresh command above, then run the build in the background:
   - **Device connected** (ADB install is the goal): `npx expo run:android --variant release` builds AND installs in one step.
   - **No device connected / Drive upload only**: `npx expo run:android` fails immediately with `CommandError: No Android connected device found` — it never even compiles. Build directly with Gradle instead, which only needs the SDK, not a device:
```bash
export JAVA_HOME="/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home" && export PATH="$JAVA_HOME/bin:$PATH:/Users/mimi/Library/Android/sdk/platform-tools" && cd android && ./gradlew assembleRelease 2>&1
```
   Output lands at the same `APK` path either way. First-time build can take several minutes — run in background.

2. Wait for build to complete. Sanity-check that it actually rebuilt: `:app:packageRelease` and `:app:assembleRelease` in the log should NOT both say `UP-TO-DATE` right after a source change — if they do, the bundle refresh step was skipped or didn't take effect.

3a. Install to connected device (if requested / device available):
```bash
export PATH="$PATH:/Users/mimi/Library/Android/sdk/platform-tools" && adb install -r android/app/build/outputs/apk/release/app-release.apk
```

3b. Upload to Google Drive (if requested / no device available):
```bash
DRIVE_ROOT=~/Library/CloudStorage/GoogleDrive-mimichild@gmail.com/我的雲端硬碟/SPARK-Builds
PROJECT=$(basename "$PWD")
VERSION=$(node -p "require('./package.json').version")
STAMP=$(date +%Y%m%d-%H%M)
DEST="$DRIVE_ROOT/$PROJECT/${PROJECT,,}-v${VERSION}-${STAMP}.apk"
mkdir -p "$DRIVE_ROOT/$PROJECT"
cp android/app/build/outputs/apk/release/app-release.apk "$DEST"
echo "Uploaded: $DEST"
```
Google Drive for Desktop syncs the copy automatically once it lands in that folder — no separate "upload" action needed. If the Drive filesystem isn't ready yet (fresh login/first sync), `mkdir`/`cp` will hang or time out — check `pgrep -fl "Google Drive"` and retry after a short wait rather than looping indefinitely.

4. Tell the user the Drive filename and/or that ADB install succeeded, so they know what to look for when downloading on the phone.

## Notes
- Connected device ID: `39011FDJH00HUZ`
- If `jlink does not exist` error → wrong JAVA_HOME (do NOT use the VS Code JRE at `~/.antigravity/...`, it's JRE-only)
- If `adb: command not found` → PATH does not include platform-tools, add it explicitly
- APK output path: `android/app/build/outputs/apk/release/app-release.apk`
- Drive uploads are additive (versioned filenames) — old builds in the folder are not deleted automatically; mention to the user if the folder is getting cluttered and offer to clean up old versions.
