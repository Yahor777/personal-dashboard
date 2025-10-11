# Google OAuth + GitHub Storage Implementation Guide

## Overview

This guide explains how to implement **Google Authentication** with **GitHub as a backend database**, ensuring data is **private and accessible only to you** (the creator).

## Architecture

```
User → Google OAuth (Firebase/Supabase) → Your App → GitHub API → Private Repository
```

### Key Components:
1. **Google OAuth**: User authentication via Google Sign-In
2. **GitHub API**: Store user data in your private GitHub repository
3. **Access Control**: Only you (creator) can access the repository with a Personal Access Token (PAT)

---

## Solution 1: Firebase Authentication + GitHub API (Recommended)

### Why This Approach?
- ✅ Free tier sufficient for personal use
- ✅ Easy Google OAuth setup
- ✅ GitHub private repository = only you have access
- ✅ No public database needed

### Step 1: Set Up Firebase Authentication

1. **Create Firebase Project**:
   ```bash
   # Go to: https://console.firebase.google.com/
   # Click "Add Project" → Name it "Personal Dashboard"
   ```

2. **Enable Google Sign-In**:
   - In Firebase Console: **Authentication** → **Sign-in method**
   - Enable **Google** provider
   - Add your authorized domain: `yahor777.github.io`

3. **Install Firebase SDK**:
   ```powershell
   npm install firebase
   ```

4. **Configure Firebase** (`src/config/firebase.ts`):
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getAuth, GoogleAuthProvider } from 'firebase/auth';

   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const googleProvider = new GoogleAuthProvider();
   ```

### Step 2: Create GitHub Private Repository for Data Storage

1. **Create Private Repository**:
   ```bash
   # Go to: https://github.com/new
   # Repository name: "personal-dashboard-data"
   # Visibility: PRIVATE ⚠️
   # Initialize with README: Yes
   ```

2. **Create Personal Access Token (PAT)**:
   ```bash
   # Go to: https://github.com/settings/tokens
   # Generate new token (classic)
   # Scopes: repo (full control)
   # Copy token: ghp_xxxxxxxxxxxxxxxxxxxx
   ```

3. **Store Token Securely**:
   - **NEVER commit to public repo!**
   - Use Firebase Environment Config (for client-side):
     ```typescript
     // Store in Firebase Remote Config or use .env.local
     VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
     VITE_GITHUB_REPO=Yahor777/personal-dashboard-data
     ```

### Step 3: Implement GitHub Storage Service

Create `src/services/githubStorageService.ts`:

```typescript
import { Octokit } from '@octokit/rest';

class GitHubStorageService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor() {
    this.octokit = new Octokit({
      auth: import.meta.env.VITE_GITHUB_TOKEN
    });
    this.owner = 'Yahor777';
    this.repo = 'personal-dashboard-data';
  }

  // Save user data as JSON file
  async saveUserData(userId: string, data: any): Promise<void> {
    const path = `users/${userId}/dashboard.json`;
    const content = btoa(JSON.stringify(data, null, 2)); // Base64 encode

    try {
      // Check if file exists
      const { data: fileData } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path
      });

      // Update existing file
      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: `Update dashboard for ${userId}`,
        content,
        sha: (fileData as any).sha // Required for updates
      });
    } catch (error: any) {
      if (error.status === 404) {
        // File doesn't exist, create new
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path,
          message: `Create dashboard for ${userId}`,
          content
        });
      } else {
        throw error;
      }
    }
  }

  // Load user data
  async loadUserData(userId: string): Promise<any> {
    const path = `users/${userId}/dashboard.json`;

    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path
      });

      // Decode Base64 content
      const content = atob((data as any).content);
      return JSON.parse(content);
    } catch (error: any) {
      if (error.status === 404) {
        return null; // No data yet
      }
      throw error;
    }
  }

  // Delete user data
  async deleteUserData(userId: string): Promise<void> {
    const path = `users/${userId}/dashboard.json`;

    const { data } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path
    });

    await this.octokit.repos.deleteFile({
      owner: this.owner,
      repo: this.repo,
      path,
      message: `Delete dashboard for ${userId}`,
      sha: (data as any).sha
    });
  }
}

export const githubStorage = new GitHubStorageService();
```

Install Octokit:
```powershell
npm install @octokit/rest
```

### Step 4: Integrate Authentication in App

Update `src/components/LoginRegisterModal.tsx`:

```typescript
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { githubStorage } from '../services/githubStorageService';

export function LoginRegisterModal({ isOpen, onClose }: Props) {
  const [user, setUser] = useState<User | null>(null);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      setUser(user);
      
      // Load user data from GitHub
      const data = await githubStorage.loadUserData(user.uid);
      
      if (data) {
        // Restore user's dashboard state
        useStore.setState({
          columns: data.columns,
          cards: data.cards,
          user: {
            id: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            avatar: user.photoURL || undefined
          }
        });
      } else {
        // New user - create initial data
        const initialData = {
          columns: useStore.getState().columns,
          cards: []
        };
        await githubStorage.saveUserData(user.uid, initialData);
      }

      onClose();
      toast.success(`Welcome, ${user.displayName}!`);
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      // Save current state before signing out
      const state = useStore.getState();
      if (user) {
        await githubStorage.saveUserData(user.uid, {
          columns: state.columns,
          cards: state.cards
        });
      }

      await signOut(auth);
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In with Google</DialogTitle>
        </DialogHeader>
        
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} alt="Avatar" className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="destructive" className="w-full">
              Sign Out
            </Button>
          </div>
        ) : (
          <Button onClick={handleGoogleSignIn} className="w-full">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              {/* Google icon SVG */}
            </svg>
            Continue with Google
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Step 5: Auto-Save Data to GitHub

Update `src/store/useStore.ts` to auto-save on changes:

```typescript
import { githubStorage } from '../services/githubStorageService';
import { auth } from '../config/firebase';

// Add auto-save effect
useStore.subscribe((state, prevState) => {
  const user = auth.currentUser;
  
  if (user && (state.cards !== prevState.cards || state.columns !== prevState.columns)) {
    // Debounced save (wait 2 seconds after last change)
    clearTimeout((window as any).autoSaveTimeout);
    (window as any).autoSaveTimeout = setTimeout(async () => {
      try {
        await githubStorage.saveUserData(user.uid, {
          columns: state.columns,
          cards: state.cards
        });
        console.log('Data auto-saved to GitHub');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000);
  }
});
```

---

## Solution 2: Supabase (Alternative)

### Advantages:
- ✅ Built-in Google OAuth
- ✅ PostgreSQL database (more powerful than GitHub files)
- ✅ Row Level Security (RLS) = only creator can access data
- ✅ Free tier: 500MB database, 50,000 monthly active users

### Quick Setup:

1. **Create Supabase Project**: https://supabase.com/dashboard
2. **Enable Google Auth**: Settings → Authentication → Google
3. **Create Tables**:
   ```sql
   CREATE TABLE dashboard_data (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     columns JSONB,
     cards JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Row Level Security: Only creator can access
   ALTER TABLE dashboard_data ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can only access their own data"
   ON dashboard_data
   FOR ALL
   USING (auth.uid() = user_id);
   ```

4. **Install Supabase**:
   ```powershell
   npm install @supabase/supabase-js
   ```

5. **Configure Supabase** (`src/config/supabase.ts`):
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = 'https://your-project.supabase.co';
   const supabaseAnonKey = 'your-anon-key';

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

---

## Privacy & Security

### How is Data Private?

#### GitHub Approach:
1. **Private Repository**: Only you (owner) can access
2. **Personal Access Token**: Required to read/write data
3. **Token in Environment Variable**: Not exposed in public code
4. **Client-Side Encryption (Optional)**: Encrypt data before saving:
   ```typescript
   const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), 'secret-key').toString();
   ```

#### Supabase Approach:
1. **Row Level Security (RLS)**: Database-level access control
2. **User ID Matching**: `auth.uid() = user_id` in policy
3. **Built-in Security**: Supabase handles token validation

### Best Practices:
- ✅ Never commit tokens to public repositories
- ✅ Use `.env.local` for sensitive data
- ✅ Add `.env.local` to `.gitignore`
- ✅ Rotate tokens every 3-6 months
- ✅ Use GitHub Actions secrets for deployment

---

## Deployment with Secrets

### GitHub Actions Workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy with Secrets

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build with environment variables
        env:
          VITE_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN_STORAGE }}
          VITE_GITHUB_REPO: ${{ secrets.GITHUB_REPO }}
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Add Secrets to GitHub:
1. Go to: **Repository Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - `GITHUB_TOKEN_STORAGE`: Your PAT (ghp_xxx)
   - `GITHUB_REPO`: `Yahor777/personal-dashboard-data`
   - `FIREBASE_API_KEY`: From Firebase config
   - `FIREBASE_AUTH_DOMAIN`: From Firebase config
   - `FIREBASE_PROJECT_ID`: From Firebase config

---

## Migration from Current System

### Step 1: Export Current Data
```typescript
// Add to ImportExportPanel.tsx
const exportForMigration = () => {
  const state = useStore.getState();
  const data = {
    columns: state.columns,
    cards: state.cards,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dashboard-migration.json';
  a.click();
};
```

### Step 2: Import to GitHub/Supabase
```typescript
// After Google Sign-In, upload migration file
const importMigration = async (file: File) => {
  const text = await file.text();
  const data = JSON.parse(text);
  
  const user = auth.currentUser;
  if (user) {
    await githubStorage.saveUserData(user.uid, data);
    useStore.setState({ columns: data.columns, cards: data.cards });
    toast.success('Migration complete!');
  }
};
```

---

## Cost Analysis

### Firebase + GitHub (Recommended):
- **Firebase Authentication**: Free for unlimited users
- **GitHub Private Repo**: Free for personal use
- **GitHub API**: 5,000 requests/hour (more than enough)
- **Total Cost**: $0/month ✅

### Supabase Alternative:
- **Free Tier**: 500MB database, 50K MAU, 2GB bandwidth
- **Pro Tier**: $25/month (unlimited database, 100K MAU)
- **Your Use Case**: Free tier sufficient ✅

---

## FAQ

### Q: Is my data really private?
**A**: Yes! With GitHub private repository + PAT, only you can access the data. With Supabase RLS, database enforces user isolation.

### Q: What if someone steals my token?
**A**: 
1. Immediately revoke the token in GitHub settings
2. Generate a new token
3. Update GitHub Actions secrets
4. Redeploy application

### Q: Can I share access with specific people?
**A**: Yes!
- **GitHub**: Add collaborators to private repo
- **Supabase**: Update RLS policy to allow specific user IDs

### Q: How much data can I store?
**A**: 
- **GitHub**: 1GB per repository (way more than needed for JSON)
- **Supabase Free**: 500MB database (thousands of cards)

### Q: What about offline access?
**A**: Implement PWA (Progressive Web App):
```typescript
// Use service worker to cache data
// Sync when online
navigator.serviceWorker.register('/sw.js');
```

---

## Next Steps

1. **Choose Solution**:
   - Personal use only → **Firebase + GitHub** (simpler)
   - Need powerful queries → **Supabase** (PostgreSQL)

2. **Implement Authentication**:
   - Follow Step 1 (Firebase setup)
   - Update LoginRegisterModal.tsx

3. **Add Storage Backend**:
   - Follow Step 2-3 (GitHub storage service)
   - OR use Supabase client

4. **Test Locally**:
   ```powershell
   npm run dev
   # Test Google sign-in
   # Create cards, verify saved to GitHub/Supabase
   ```

5. **Deploy with Secrets**:
   - Add secrets to GitHub Actions
   - Push to main branch
   - Verify production build works

---

## Support Resources

- **Firebase Docs**: https://firebase.google.com/docs/auth
- **GitHub API**: https://docs.github.com/en/rest
- **Octokit.js**: https://github.com/octokit/octokit.js
- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Vite Environment Variables**: https://vite.dev/guide/env-and-mode

---

**Ready to implement?** Start with Firebase + GitHub for the simplest solution, or contact me if you need help setting up Supabase!
