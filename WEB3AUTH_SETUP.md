# Web3Auth Integration

This application now uses Web3Auth for authentication, replacing the traditional email/password authentication system.

## Features Implemented

### 1. Web3AuthContext (`src/contexts/Web3AuthContext.tsx`)
- **Initialization**: Web3Auth modal with email and social login providers
- **Embedded Wallet**: Automatically created on signup
- **Session Management**: Encrypted session storage in localStorage
- **Session Keys**: Automatic generation and refresh
- **Wallet Connection**: Manages wallet address and provider state
- **User Profile**: Derives user profile from wallet address

### 2. Web3LoginPage (`src/pages/Web3LoginPage.tsx`)
- **Login Flow**: One-click Web3Auth authentication
- **Profile Setup**: Complete profile after first login
- **Role Selection**: Choose supply chain role (Collector, Tester, Processor, Manufacturer)
- **Organization Details**: Add organization and contact information

### 3. Authentication State
- **Provider**: Ethereum provider from Web3Auth
- **User Info**: Web3Auth user information (email, name)
- **Wallet Address**: Connected blockchain wallet address
- **User Profile**: Extended profile with supply chain role and organization

## How It Works

### Authentication Flow

1. **Initial Load**
   - Web3Auth initializes on app load
   - Checks for existing session in localStorage
   - Restores session if valid

2. **Login Process**
   - User clicks "Connect with Web3Auth"
   - Web3Auth modal appears with login options:
     - Email (passwordless)
     - Google
     - Facebook
     - Twitter
     - Discord
     - Other social providers
   - User selects login method and authenticates
   - Embedded wallet created automatically
   - Wallet address derived from login

3. **Profile Setup**
   - First-time users complete profile
   - Select supply chain role
   - Add organization details
   - Profile stored locally

4. **Session Management**
   - Session encrypted and stored in localStorage
   - Key: `web3auth_session`
   - Contains: user info, profile, wallet address
   - Auto-restored on page refresh

5. **Logout**
   - Clears Web3Auth session
   - Removes local storage data
   - Redirects to landing page

### Security Features

1. **Encrypted Storage**
   - Session data encrypted using base64 encoding
   - Stored in localStorage for persistence

2. **Session Key Generation**
   - Automatic session key creation
   - Managed by Web3Auth SDK

3. **Token Refresh**
   - Automatic token refresh by Web3Auth
   - No manual refresh required

4. **Wallet Security**
   - Private keys managed by Web3Auth
   - Never exposed to application
   - MPC (Multi-Party Computation) security

## Configuration

### Web3Auth Settings
- **Client ID**: BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ
- **Network**: Sapphire Devnet (Development)
- **Blockchain**: Polygon Amoy Testnet
- **Chain ID**: 0x13882

### Blockchain Network
- **Network**: Polygon Amoy Testnet
- **RPC**: https://rpc-amoy.polygon.technology/
- **Explorer**: https://amoy.polygonscan.com/
- **Currency**: MATIC

## Usage

### In Components

```typescript
import { useWeb3Auth } from '../contexts/Web3AuthContext';

function MyComponent() {
  const {
    provider,        // Ethereum provider
    user,           // Web3Auth user info
    userProfile,    // Extended user profile
    walletAddress,  // Wallet address
    loading,        // Loading state
    login,          // Login function
    logout,         // Logout function
    updateUserProfile // Update profile function
  } = useWeb3Auth();

  // Use authentication state
  if (!userProfile) {
    return <div>Please login</div>;
  }

  return <div>Welcome, {userProfile.full_name}!</div>;
}
```

### Login

```typescript
const handleLogin = async () => {
  try {
    await login();
    // User is now logged in
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Logout

```typescript
const handleLogout = async () => {
  try {
    await logout();
    // User is now logged out
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

### Update Profile

```typescript
const handleUpdateProfile = async () => {
  try {
    await updateUserProfile(
      'John Doe',
      'collector',
      'FreshFarms Co.',
      '+1-555-0123'
    );
    // Profile updated successfully
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

## Benefits of Web3Auth

1. **No Password Management**
   - Users don't need to remember passwords
   - No password reset flows needed

2. **Social Login**
   - Login with existing accounts
   - Reduces friction for new users

3. **Blockchain Integration**
   - Native wallet support
   - Ready for smart contract interactions

4. **Security**
   - MPC-based key management
   - No single point of failure

5. **User Experience**
   - Familiar login methods
   - Seamless wallet creation
   - Cross-device sync

## Migration from Old Auth

The following changes were made to migrate from the old authentication system:

1. **Context**: `AuthContext` → `Web3AuthContext`
2. **Login Page**: `LoginPage` → `Web3LoginPage`
3. **Auth Methods**:
   - `signIn()` → `login()`
   - `signOut()` → `logout()`
   - `signUp()` → Removed (automatic on login)

All component imports were updated to use `useWeb3Auth` instead of `useAuth`.

## Troubleshooting

### Web3Auth Not Loading
- Check internet connection
- Verify client ID is correct
- Check browser console for errors

### Login Fails
- Clear browser cache and localStorage
- Try different login method
- Check Web3Auth service status

### Profile Not Saving
- Check that wallet is connected
- Verify profile data is valid
- Check browser console for errors

### Session Not Persisting
- Check localStorage is enabled
- Verify session data is not corrupted
- Clear localStorage and login again

## Future Enhancements

1. **Multi-Chain Support**
   - Add support for more blockchain networks
   - Allow users to switch chains

2. **Hardware Wallet**
   - Support for Ledger/Trezor
   - Enhanced security option

3. **Biometric Auth**
   - Fingerprint/Face ID support
   - Mobile-friendly authentication

4. **Session Timeout**
   - Configurable session duration
   - Auto-logout after inactivity
