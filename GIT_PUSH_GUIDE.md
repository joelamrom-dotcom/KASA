# How to Push Changes to GitHub KASA Repository

## Current Status
- **Repository**: `https://github.com/joelamrom-dotcom/KASA.git`
- **Location**: `kasa-family-management/` directory
- **Authentication Method**: HTTPS (requires Personal Access Token)

## Step 1: Create a GitHub Personal Access Token (PAT)

1. Go to GitHub.com and sign in
2. Click your profile picture (top right) → **Settings**
3. Scroll down to **Developer settings** (left sidebar)
4. Click **Personal access tokens** → **Tokens (classic)**
5. Click **Generate new token** → **Generate new token (classic)**
6. Give it a name: `KASA Repository Access`
7. Set expiration (recommend 90 days or custom)
8. Select scopes:
   - ✅ **repo** (Full control of private repositories)
     - This includes: repo:status, repo_deployment, public_repo, repo:invite, security_events
9. Click **Generate token**
10. **COPY THE TOKEN IMMEDIATELY** - you won't see it again!

## Step 2: Push Your Changes

### Option A: Use Git Credential Manager (Recommended)

1. Open PowerShell in the `kasa-family-management` directory:
   ```powershell
   cd kasa-family-management
   ```

2. Stage your changes:
   ```powershell
   git add app/login/page.tsx
   git add middleware.ts
   git add app/components/ServiceWorkerRegistration.tsx
   git add public/manifest.json
   git add app/layout.tsx
   git add lib/auth.ts
   git add app/api/kasa/push/send/route.ts
   ```

   Or stage all changes:
   ```powershell
   git add .
   ```

3. Commit your changes:
   ```powershell
   git commit -m "Fix authentication redirect loop, service worker errors, and missing logo"
   ```

4. Push to GitHub:
   ```powershell
   git push origin main
   ```

5. When prompted for credentials:
   - **Username**: `joelamrom-dotcom`
   - **Password**: Paste your Personal Access Token (NOT your GitHub password)

### Option B: Store Credentials (One-time setup)

After the first push, you can store credentials:

```powershell
git config --global credential.helper wincred
```

Then when you push, enter:
- Username: `joelamrom-dotcom`
- Password: Your PAT token

### Option C: Use SSH Instead (Alternative)

If you prefer SSH:

1. Generate SSH key (if you don't have one):
   ```powershell
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add SSH key to GitHub:
   - Copy your public key: `cat ~/.ssh/id_ed25519.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste and save

3. Change remote to SSH:
   ```powershell
   cd kasa-family-management
   git remote set-url origin git@github.com:joelamrom-dotcom/KASA.git
   ```

4. Push:
   ```powershell
   git push origin main
   ```

## Quick Commands Summary

```powershell
# Navigate to repository
cd kasa-family-management

# Check status
git status

# Stage all changes
git add .

# Commit
git commit -m "Your commit message here"

# Push (will prompt for username and PAT)
git push origin main
```

## Troubleshooting

### "Authentication failed" error
- Make sure you're using the Personal Access Token, not your GitHub password
- Verify the token has `repo` scope enabled
- Check if the token has expired

### "Permission denied" error
- Verify you have push access to the repository
- Check if the repository is private and your token has access

### "Remote origin already exists" error
- Check current remote: `git remote -v`
- Update remote: `git remote set-url origin https://github.com/joelamrom-dotcom/KASA.git`

## Notes

- Your branch is **93 commits ahead** of origin/main - you may want to push those first
- The changes we just made are in the parent directory, so you may need to copy them to `kasa-family-management/` or work from the parent directory if that's where your git repo is

