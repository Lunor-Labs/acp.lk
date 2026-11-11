# Database Abstraction Layer - Environment Variables

## Database Type Selection

To switch between databases, set the `VITE_DB_TYPE` environment variable:

```bash
# Use Supabase (PostgreSQL)
VITE_DB_TYPE=supabase

# Use Firebase (when implemented)
VITE_DB_TYPE=firebase
```

## Supabase Configuration

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Firebase Configuration (Future)

When ready to switch to Firebase, add these variables:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

## Usage in Code

### Old Way (Direct Supabase)
```typescript
import { supabase } from './lib/supabase';

const { data } = await supabase.from('classes').select('*');
```

### New Way (Database Abstraction)
```typescript
import { db } from './lib/database';

const { data } = await db.from('classes').select().execute();
```

The new way allows you to switch databases without changing your code!
