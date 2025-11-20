# Progressive Web App (PWA) Setup Guide

## Overview
The Kasa Family Management system is now a fully functional Progressive Web App (PWA) that can be installed on mobile devices and desktop computers.

## Features Implemented

### 1. ✅ PWA Manifest
- **File**: `public/manifest.json`
- **Features**:
  - App name and description
  - Icons (192x192 and 512x512)
  - Theme colors
  - Display mode (standalone)
  - Shortcuts for quick access
  - Share target support

### 2. ✅ Service Worker
- **File**: `public/sw.js`
- **Features**:
  - Offline caching
  - Asset precaching
  - Runtime caching
  - Background sync
  - Push notification handling

### 3. ✅ PWA Installation Prompt
- **Component**: `app/components/PWAInstallPrompt.tsx`
- **Features**:
  - Automatic installation prompt
  - Dismissible with "don't show again" logic
  - Mobile and desktop support

### 4. ✅ Push Notifications
- **Components**: 
  - `app/components/PushNotificationManager.tsx`
  - `app/api/kasa/push/subscribe/route.ts`
  - `app/api/kasa/push/unsubscribe/route.ts`
  - `app/api/kasa/push/send/route.ts`
- **Features**:
  - Subscribe/unsubscribe to push notifications
  - Send notifications to users
  - VAPID key support

### 5. ✅ Mobile Responsiveness
- **CSS**: `app/globals.css`
- **Features**:
  - Touch-optimized button sizes (44px minimum)
  - Mobile-friendly tables
  - Safe area insets for notched devices
  - Responsive sidebar (hidden on mobile, shown on desktop)

### 6. ✅ Offline Support
- **Component**: `app/components/OfflineIndicator.tsx`
- **Features**:
  - Visual indicator when offline
  - Service worker caching for offline access

### 7. ✅ Touch-Optimized Components
- **Components**:
  - `app/components/TouchOptimizedButton.tsx`
  - `app/components/MobileOptimizedTable.tsx`
- **Features**:
  - Minimum touch target sizes
  - Active state feedback
  - Mobile-friendly interactions

## Setup Instructions

### 1. Generate VAPID Keys (for Push Notifications)

To enable push notifications, you need to generate VAPID keys:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Add the keys to your `.env` file:
```
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

### 2. Add App Icons

Place your app icons in the `public` folder:
- `kasa-logo.png` (192x192 and 512x512)
- Update `manifest.json` if using different filenames

### 3. Test PWA Installation

1. **Chrome/Edge Desktop**:
   - Open the app in Chrome/Edge
   - Look for the install icon in the address bar
   - Click to install

2. **Mobile (iOS Safari)**:
   - Open the app in Safari
   - Tap the Share button
   - Select "Add to Home Screen"

3. **Mobile (Android Chrome)**:
   - Open the app in Chrome
   - Tap the menu (3 dots)
   - Select "Add to Home Screen" or "Install App"

### 4. Test Offline Mode

1. Open the app in your browser
2. Open DevTools → Application → Service Workers
3. Check "Offline" checkbox
4. Refresh the page
5. The app should still work (cached pages)

### 5. Test Push Notifications

1. Click the notification bell icon in the sidebar
2. Grant notification permission when prompted
3. Test sending a notification via the API:
   ```bash
   curl -X POST http://localhost:3000/api/kasa/push/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "title": "Test Notification",
       "body": "This is a test notification",
       "url": "/"
     }'
     ```

## Mobile Optimizations

### Responsive Design
- Sidebar is hidden on mobile (< 768px)
- Mobile menu button appears in top-left
- Tables are optimized for mobile viewing
- Touch targets are minimum 44px

### Safe Area Insets
The app uses CSS safe area insets for devices with notches:
- `.safe-top` - Top safe area
- `.safe-bottom` - Bottom safe area
- `.safe-left` - Left safe area
- `.safe-right` - Right safe area

### Touch Interactions
- All buttons have `touch-action: manipulation`
- Active states provide visual feedback
- Swipe gestures supported where applicable

## Browser Support

### Full PWA Support
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Samsung Internet

### Partial Support
- ⚠️ Safari (Desktop) - Limited service worker support
- ⚠️ Opera - Full support but less common

## Troubleshooting

### Service Worker Not Registering
1. Check browser console for errors
2. Ensure HTTPS (or localhost for development)
3. Check `next.config.js` headers configuration

### Push Notifications Not Working
1. Verify VAPID keys are set in `.env`
2. Check browser notification permissions
3. Ensure service worker is registered
4. Check browser console for errors

### App Not Installable
1. Verify `manifest.json` is accessible at `/manifest.json`
2. Check that service worker is registered
3. Ensure app is served over HTTPS (or localhost)
4. Check browser console for PWA errors

### Offline Mode Not Working
1. Verify service worker is registered
2. Check `sw.js` file is accessible
3. Clear browser cache and reload
4. Check service worker cache in DevTools

## Next Steps

1. **Generate VAPID Keys**: Run `web-push generate-vapid-keys` and add to `.env`
2. **Add App Icons**: Place proper icons in `public` folder
3. **Test Installation**: Test on various devices and browsers
4. **Customize Manifest**: Update `manifest.json` with your branding
5. **Configure Notifications**: Set up notification preferences in settings

## API Endpoints

### Push Notifications
- `GET /api/kasa/push/subscribe` - Get VAPID public key
- `POST /api/kasa/push/subscribe` - Subscribe to push notifications
- `POST /api/kasa/push/unsubscribe` - Unsubscribe from push notifications
- `POST /api/kasa/push/send` - Send push notification (admin only)

## Components

### PWAInstallPrompt
Shows installation prompt for PWA. Automatically appears after 3 seconds if:
- App is not already installed
- Browser supports PWA installation
- User hasn't dismissed it in the last 7 days

### PushNotificationManager
Manages push notification subscriptions. Shows in sidebar user menu.

### OfflineIndicator
Shows a banner when the app is offline. Automatically appears/disappears based on connection status.

### MobileSidebar
Mobile-friendly sidebar that slides in from the left. Only visible on mobile devices.

### TouchOptimizedButton
Button component with touch-optimized sizing and interactions.

### MobileOptimizedTable
Table wrapper that makes tables mobile-friendly with horizontal scrolling.

## Environment Variables

```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

## Notes

- Service worker updates automatically when new version is deployed
- Push notifications require HTTPS (except localhost)
- iOS Safari has limited PWA support compared to Android
- Offline mode caches static assets and pages, but API calls still require network

