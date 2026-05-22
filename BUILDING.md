# Building the native app (Capacitor)

The XXXo game ships with a [Capacitor](https://capacitorjs.com) wrapper so the
same web build can be packaged as a native Android (and eventually iOS) app.

## Strategy: remote URL

The native shell **loads the production web app from its public URL** rather
than bundling a static export. This keeps a single deploy / single codebase
and lets Socket.IO + the API routes keep working unchanged.

The downside: the app needs internet to start. That's an acceptable tradeoff
for now — when the user has signal it feels identical to a fully native build.
Offline support for local + AI modes is provided by the PWA service worker
(see [next.config.ts](next.config.ts) `withSerwist`).

The remote URL is configured in [capacitor.config.ts](capacitor.config.ts).

| Mode | URL the app loads |
| --- | --- |
| `CAP_DEV=1` (LAN testing) | `$CAP_DEV_URL` (default `http://localhost:3000`) |
| Production (default) | `https://xxxo.bothosts.com` |

## One-time setup (Android)

You need:

- Java 17 JDK
- Android Studio (Hedgehog or newer) — gives you the SDK + emulator
- The `ANDROID_HOME` environment variable pointing at the SDK location

Then from the project root:

```powershell
npx cap add android
```

This generates an `android/` directory (a normal Android Studio Gradle project)
which **should be committed**. After that, you sync the latest Capacitor + plugin
versions into it whenever you change deps:

```powershell
npx cap sync android
```

## One-time setup (iOS)

iOS builds require macOS with Xcode 15+ installed. On Windows you cannot build
the iOS artefact locally — use a CI service like [Codemagic](https://codemagic.io)
or [Ionic Appflow](https://ionic.io/appflow) instead.

On a Mac:

```bash
npx cap add ios
npx cap sync ios
```

## Local LAN testing (Android, fastest loop)

1. Find your laptop's LAN IP (`ipconfig` on Windows → the IPv4 address of your
   Wi-Fi adapter, e.g. `192.168.1.42`).
2. Start the web app bound to all interfaces:
   ```powershell
   npm run dev:full
   ```
   (Already binds to `0.0.0.0:3000` — see [package.json](package.json) `dev`.)
3. In a second terminal, sync + run with the dev URL.

   **PowerShell** (prompt starts with `PS`):
   ```powershell
   $env:CAP_DEV = "1"
   $env:CAP_DEV_URL = "http://192.168.1.42:3000"
   npx cap sync android
   npx cap run android
   ```

   **cmd.exe** (prompt is `C:\...>`):
   ```cmd
   set CAP_DEV=1
   set CAP_DEV_URL=http://192.168.1.42:3000
   npx cap sync android
   npx cap run android
   ```

   Both `$env:VAR` and `set VAR` only persist for the current shell session.

Your phone (or the emulator) must be on the same network. The
`cleartext: true` setting in [capacitor.config.ts](capacitor.config.ts) only
applies when `CAP_DEV=1`, so production builds stay HTTPS-only.

## Production Android build

```powershell
npm run build           # builds the web app (also regenerates the SW)
npx cap sync android    # copies any updated config to the native project
npx cap open android    # opens Android Studio
```

In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.
Sign with your release keystore (you create one once via Android Studio's wizard
and store it outside the repo). Upload the `.aab` to Play Console.

Key signing notes:

- Keep the keystore + passwords in a password manager. Losing it means you
  can never update the same Play Store listing again.
- Add the unsigned `.aab` path to `.gitignore`; never commit the keystore.

## Native features wired up

| Feature | Plugin | Where |
| --- | --- | --- |
| Status bar colour (`#0D1117`) | `@capacitor/status-bar` | [src/lib/native.ts](src/lib/native.ts) `initNativeShell` |
| Splash screen dismiss | `@capacitor/splash-screen` | same |
| Light haptic on every move | `@capacitor/haptics` | [src/hooks/useLocalGame.ts](src/hooks/useLocalGame.ts) via [src/lib/native.ts](src/lib/native.ts) |
| Success haptic on game-end | `@capacitor/haptics` | same |
| Preferences (future) | `@capacitor/preferences` | installed but not yet wired — `localStorage` works in the WebView for now |

All native calls are wrapped so they're no-ops on the regular web — the same
codebase runs identically in a browser, a PWA, and a native shell.

## Updating Capacitor

```powershell
npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest @capacitor/ios@latest
npm install @capacitor/status-bar@latest @capacitor/splash-screen@latest @capacitor/haptics@latest @capacitor/preferences@latest
npx cap sync
```

Major version bumps occasionally need manual native project changes — read the
[Capacitor migration guides](https://capacitorjs.com/docs/updating) when you do
one.

## Troubleshooting

**`npx cap add android` complains it can't find SDK location**
You haven't set `ANDROID_HOME`. On Windows: `setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"` then reopen your terminal.

**App opens but shows a blank screen**
Either the remote URL is unreachable from the device (check `CAP_DEV_URL`) or
the device has no internet. The native shell can't render anything until it
fetches the web app.

**App icon / splash screen are wrong**
Capacitor reads the icon from `android/app/src/main/res/mipmap-*/`. Use the
[Capacitor Assets](https://github.com/ionic-team/capacitor-assets) CLI to
generate all densities from a single 1024×1024 source:
```powershell
npm install -D @capacitor/assets
npx capacitor-assets generate --android --iconBackgroundColor "#0D1117"
```
