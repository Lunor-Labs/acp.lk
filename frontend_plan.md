# Modular Frontend Implementation Plan

To ensure the new `frontend/` project is highly maintainable, scalable, and modular, we will move away from the "everything in one folder" approach of the old codebase. We will adopt a **Feature-Driven Architecture** combined with strict separation of concerns.

## 1. Modular Directory Structure

Instead of grouping files by technical type (e.g., all hooks in one folder, all components in another), we will group them **by feature**.

```text
frontend/src/
├── api/                  # Centralized API client wrapper (fetch/axios)
├── assets/               # Static files (images, icons)
├── components/           # 🧩 Global Shared UI (Buttons, Inputs, Modals, Layouts)
├── config/               # Environment variables and global configs
├── contexts/             # Global React Contexts (AuthContext, ThemeContext)
├── features/             # 🚀 Feature-Driven Modules (The Core of the App!)
│   ├── auth/             #   --> UI, hooks, api calls specific to Auth
│   ├── dashboard/        #   --> UI, hooks, api calls specific to Dashboard
│   ├── classes/          #   --> UI, hooks, api calls specific to Classes
│   └── exams/            #   --> UI, hooks, api calls specific to Exams
├── hooks/                # Global generic hooks (useWindowSize, useClickOutside)
├── lib/                  # Generic utilities (date formatter, tailwind merge `cn`)
├── pages/                # Top-level Routing Pages (Wires features together)
├── types/                # Global TypeScript declarations
└── App.tsx               # Main entry point & Router setup
```

## 2. Key Architectural Decisions

### A. Separation of API & UI (The "Service" Pattern)
In the old code, components talked directly to Supabase. In the new code, the UI component will **never** know where data comes from. 
- We will define API calls in `features/[feature]/api.ts` (e.g., `features/exams/api.ts`).
- UI components will import custom hooks like `useExams()` which internally call the API.

### B. State Management (React Query vs. Context)
- **Global State:** Keep it minimal. Use React Context *only* for the logged-in User and Theme.
- **Server State (Data Fetching):** We will introduce **TanStack React Query** (or standard localized `useEffect` wrappers if preferred) to handle data fetching, loading states, error states, and caching automatically.

### C. Container vs. Presentational Components
- **Presentational (Dumb):** purely visual, take props, emit events (`components/ui/Button.tsx`).
- **Containers (Smart):** Talk to APIs, manage state, pass data down to pure components (`features/exams/ExamList.tsx`).

---

## 3. Step-by-Step Migration Strategy

Instead of building everything at once, we’ll port the old code feature-by-feature into the new modular design.

### Step 1: Foundation & Infrastructure
- Set up Tailwind CSS inside `frontend/` (using configuration copied from `old/`).
- Create `src/lib/utils.ts` for standard helper functions.
- Create the core `apiClient.ts` that will attach the auth token to outgoing requests to the backend server.
- Port the Global `AuthContext`, connecting it to our new `/api/auth/me` backend route instead of Supabase.

### Step 2: Global UI Library
- Port the foundational, dumb UI components from the old code into `src/components/ui/`.
- Examples: `Card`, `Button`, `Input`, `Navbar`, `Footer`, `Sidebar`.
- Ensure these components are stripped of any business logic or direct API calls.

### Step 3: Feature Porting Pipeline
We will port domains one by one into the `src/features/` folder:
1. **Public/Landing Pages:** Copy the marketing layout and simple pages.
2. **Auth Domain:** Sign in, Sign Up, JWT token storage.
3. **Dashboard:** Teacher and student overview screens.
4. **Classes & Enrollments:** Listing subjects, joining specific classes.
5. **Exams/Tests Domain:** The most complex part. Port the taking and grading logics strictly separating state from view.

---

## Example: What a "Feature" Folder Looks Like

If we take the "Exams" feature, the structure inside `src/features/exams/` would be:
* `api.ts` — `export const fetchExams = () => apiClient.get('/exams')`
* `hooks.ts` — `export const useExams = () => useQuery(...)`
* `types.ts` — Interface definitions for Exam, Question, Answer.
* `components/ExamCard.tsx` — A card to display exam info.
* `components/ExamSimulator.tsx` — The complex component where users click answers.

By relying on this structure, developers opening the `exams/` directory immediately have everything they need without hunting through 10 different global folders.
