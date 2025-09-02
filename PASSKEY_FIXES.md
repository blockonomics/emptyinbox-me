# Passkey Fixes for Windows and Android GPM

This document outlines the fixes implemented to resolve passkey authentication issues on Windows and Android devices, particularly focusing on Google Password Manager (GPM) integration.

## Issues Addressed

### 1. Windows Passkey Problems

- **Problem**: Passkeys that previously worked on Windows stopped working
- **Root Cause**: Inconsistent WebAuthn configuration and timeout issues
- **Solution**: Improved registration options and better platform detection

### 2. Android GPM Integration Issues

- **Problem**: During registration, passkeys save to device but aren't found during authentication
- **Root Cause**: Missing conditional mediation support and improper resident key configuration
- **Solution**: Enabled conditional mediation and required resident keys

## Technical Fixes Implemented

### Backend Changes (`api/auth.py`)

#### Enhanced Registration Options

```python
registration_options = {
    # ... existing options ...
    'pubKeyCredParams': [
        {'type': 'public-key', 'alg': -7},   # ES256 (Elliptic Curve)
        {'type': 'public-key', 'alg': -257}, # RS256 (RSA)
        {'type': 'public-key', 'alg': -8},   # EdDSA (Ed25519)
        {'type': 'public-key', 'alg': -35},  # ES384
        {'type': 'public-key', 'alg': -36},  # ES512
        {'type': 'public-key', 'alg': -37},  # PS256 (RSA PSS)
        {'type': 'public-key', 'alg': -38},  # PS384
        {'type': 'public-key', 'alg': -39},  # PS512
        {'type': 'public-key', 'alg': -258}, # RS384
        {'type': 'public-key', 'alg': -259}, # RS512
    ],
    'timeout': 120000,  # Increased from 60000
    'authenticatorSelection': {
        'authenticatorAttachment': 'platform',  # Changed from 'cross-platform'
        'residentKey': 'required',  # Changed from 'preferred'
        'userVerification': 'preferred',
        'requireResidentKey': True  # Explicitly require resident key
    },
    'extensions': {
        'credProps': True  # Enable credential properties for debugging
    }
}
```

#### Improved Authentication Options

```python
auth_options = {
    'challenge': base64url_encode(challenge),
    'timeout': 120000,  # Increased timeout
    'userVerification': 'preferred',  # Changed from 'required'
    'rpId': get_rp_id_from_domain(DOMAIN),  # Explicitly set RP ID
    'extensions': {
        'appid': None,  # Disable problematic extensions
        'txAuthSimple': None,
        'txAuthGeneric': None,
        'authnSel': None,
        'exts': None,
    }
}
# Empty allowCredentials for usernameless authentication
auth_options['allowCredentials'] = []
```

### Frontend Changes (`static/services/apiService.js`)

#### Enhanced Error Handling

- Added comprehensive error handling for common WebAuthn errors
- Platform-specific error messages
- Better debugging information

#### Improved WebAuthn Options

```javascript
const createOptions = {
  publicKey,
  signal: AbortSignal.timeout(120000), // 2 minute timeout
};

const getOptions = {
  publicKey,
  signal: AbortSignal.timeout(120000),
  mediation: "conditional", // Better for Android GPM
};
```

#### Platform Detection

```javascript
export function checkPasskeySupport() {
  const isSupported = window.PublicKeyCredential !== undefined;
  const isConditionalMediationSupported =
    window.PublicKeyCredential?.isConditionalMediationAvailable?.() || false;

  return {
    isSupported,
    isConditionalMediationSupported,
    platform: getPlatform(),
  };
}
```

### UI Improvements (`static/components/pages/Login/index.js`)

#### Debug Information

- Added debug info section showing platform and passkey support
- Better error messages for different failure scenarios
- Console logging for troubleshooting

#### Enhanced Authentication Flow

- Improved timeout handling
- Better credential retrieval with conditional mediation
- Platform-specific optimizations

## Key Changes for Android GPM

### 1. Conditional Mediation

- **What**: Enables Google Password Manager to intercept passkey requests
- **Implementation**: Added `mediation: "conditional"` to credential retrieval
- **Benefit**: Allows GPM to show saved passkeys during authentication

### 2. Resident Keys

- **What**: Passkeys that can be discovered without knowing the credential ID
- **Implementation**: Set `residentKey: 'required'` and `requireResidentKey: true`
- **Benefit**: Enables usernameless authentication and better GPM integration

### 3. Platform Attachment

- **What**: Forces use of platform authenticators (device-specific)
- **Implementation**: Set `authenticatorAttachment: 'platform'`
- **Benefit**: Better integration with Android's built-in authenticator

## Testing and Debugging

### Debug Page

Created `static/debug-passkeys.html` to help troubleshoot issues:

- Platform detection
- WebAuthn support verification
- Conditional mediation testing
- Real-time logging

### Console Logging

Enhanced logging throughout the authentication flow:

- Registration steps
- Authentication attempts
- Error details
- Platform information

## Usage Instructions

### 1. Test Passkey Support

Visit `/debug-passkeys.html` to check your device's passkey capabilities.

### 2. Registration Flow

1. Enter username
2. Click "Continue"
3. Follow device-specific prompts (Windows Hello, Android biometric, etc.)
4. Passkey is created and stored

### 3. Authentication Flow

1. Click "Sign in with a passkey"
2. Device should show available passkeys
3. Select and authenticate with your passkey

## Troubleshooting

### Windows Issues

- Ensure Windows Hello is enabled
- Check that biometric authentication is set up
- Verify the site is using HTTPS (or localhost for development)

### Android Issues

- Ensure Google Password Manager is enabled
- Check that biometric authentication is set up
- Verify Chrome is up to date
- Test conditional mediation support

### Common Error Messages

- **NotAllowedError**: User cancelled or authentication failed
- **InvalidStateError**: No passkey found (create account first)
- **NotSupportedError**: Device doesn't support passkeys
- **SecurityError**: HTTPS/localhost required
- **AbortError**: Authentication timed out

## Browser Compatibility

### Fully Supported

- Chrome 67+ (Android, Windows, macOS, Linux)
- Edge 18+ (Windows)
- Safari 13+ (macOS, iOS)
- Firefox 60+ (Windows, macOS, Linux)

### Partially Supported

- Some older browsers may have limited WebAuthn support
- Conditional mediation varies by browser version

## Security Considerations

- Passkeys are stored securely on the device
- No passwords are transmitted or stored
- Biometric authentication provides strong security
- Resident keys enable usernameless authentication
- All communication uses HTTPS in production

## Future Improvements

- Add support for hardware security keys
- Implement backup passkey recovery
- Add multi-device passkey synchronization
- Enhance cross-platform compatibility
- Add analytics for authentication success rates

## Support

If you continue to experience issues:

1. Check the debug page for platform-specific information
2. Review browser console for error details
3. Verify device biometric authentication is working
4. Test with the debug page to isolate issues
5. Check browser and OS updates
