# ClinicOS - Download APK

## 📱 Download the Android App

### From GitHub Actions (Recommended)

1. Go to the [Actions tab](../../actions/workflows/build-apk.yml) in this repository
2. Click on the most recent successful workflow run
3. Scroll down to the **Artifacts** section
4. Download `clinc-os-debug-apk.zip`
5. Extract the ZIP file to get `app-debug.apk`
6. Transfer the APK to your Android device and install it

### Manual Trigger

You can manually trigger a build:
1. Go to [Actions → Build Android APK](../../actions/workflows/build-apk.yml)
2. Click "Run workflow"
3. Select the branch (usually `main`)
4. Click "Run workflow"
5. Wait for the build to complete (~5-10 minutes)
6. Download the APK from the artifacts

## 📦 Installing the APK

### On Your Device
1. Enable "Install from Unknown Sources" in your Android settings
2. Open the downloaded `app-debug.apk` file
3. Follow the installation prompts

### Using ADB (Developer Method)
```bash
adb install app-debug.apk
```

## 🔄 Automatic Builds

The APK is automatically built when:
- Code is pushed to the `main` branch
- You manually trigger the workflow

Artifacts are kept for **90 days**.

## ⚠️ Important Notes

- This is a **debug APK**, not optimized for production
- You may see a warning about installing from unknown sources (this is normal)
- The app requires an internet connection to sync with Supabase

---

For development setup and local builds, see the main [README.md](README.md).
