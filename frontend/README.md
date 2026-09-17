# Frontend — Duty CRUD UI

Client-side application to manage the duties list, written in React 18 + TypeScript (strict mode) and built with Vite. It uses plain HTML elements and a single CSS file, with no component library and no global state library.

It is completely independent from the backend: it never imports backend code and only talks to the API over HTTP with `fetch`.

Runtime dependencies: `react`, `react-dom` and `zod` (form validation).

> Back to the [main README](../README.md) for the full picture and design decisions.

---

## Screenshots

| Duties list | Editing a duty |
|---|---|
| ![Duties list](../docs/screenshots/duties-list.png) | ![Edit mode](../docs/screenshots/edit-mode.png) |

| Validation before calling the API | Backend not reachable | Mobile |
|---|---|---|
| ![Validation error](../docs/screenshots/validation-error.png) | ![Error state](../docs/screenshots/error-state.png) | ![Mobile](../docs/screenshots/mobile.png) |

---

## Getting started

From the repository root:

```bash
npm install
npm run dev --workspace frontend   # http://localhost:5173
```

The backend must be running for the app to load data (see [backend/README.md](../backend/README.md)). Without it, the page shows *"Could not connect to the server"*.

### API URL

The app calls `http://localhost:3000/api` by default. To point it somewhere else:

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

```env
VITE_API_URL=http://localhost:3000/api
```

Vite replaces `import.meta.env.VITE_API_URL` when the app is built, so after changing it the dev server has to be restarted (or the app rebuilt). If you change the frontend port, update `FRONTEND_URL` in the backend so CORS allows it.

### Scripts

| Script | Command | What it does |
|---|---|---|
| `npm run dev` | `vite` | Development server with hot reload |
| `npm run build` | `tsc -b && vite build` | Type checks, then builds the static files in `dist/` |
| `npm run preview` | `vite preview` | Serves the production build locally |
| `npm test` | `jest --runInBand` | Runs all tests |

---

## Folder structure

```
frontend/
├── index.html                           # only a <div id="root"> and the entry script
├── vite.config.ts
├── jest.config.js
├── .env.example
└── src/
    ├── main.tsx                         # mounts <App /> and imports the global CSS
    ├── App.tsx                          # page layout: header, load error, form and list
    ├── config/
    │   ├── env.ts                       # API_URL from VITE_API_URL
    │   └── __mocks__/env.ts             # fixed URL for Jest (it cannot read import.meta.env)
    ├── types/duty.ts                    # Duty interface
    ├── services/
    │   ├── api-client.ts                # the only place that calls fetch
    │   └── duty.service.ts              # getDuties, createDuty, updateDuty, deleteDuty
    ├── hooks/useDuties.ts               # list state and create/edit/delete actions
    ├── components/duties/
    │   ├── CreateDutyForm.tsx           # input + "Add duty"
    │   ├── DutiesList.tsx               # loading, empty and list states
    │   └── DutyItem.tsx                 # one duty: view mode, edit mode, delete
    ├── utils/validateDutyName.ts        # zod schema for the name
    ├── styles/global.css                # all the styles, with CSS variables
    ├── setupTests.ts                    # jest-dom matchers
    └── __tests__/
```

---

## How data flows

```
CreateDutyForm / DutyItem        render and handle user input
        │  onCreate / onUpdate / onDelete (props)
        ▼
hooks/useDuties                  keeps the list in useState and updates it
        │  createDuty / updateDuty / deleteDuty
        ▼
services/duty.service            one function per endpoint
        │  apiRequest
        ▼
services/api-client              fetch + response.ok + readable errors
        │  HTTP (JSON)
        ▼
Backend API
```

Example — editing a duty:

1. The user clicks **Edit**. `DutyItem` copies the current name into its local state and shows the input.
2. On **Save** (or Enter), the name is validated with `validateDutyName`. If it is empty or too long, the message appears under the input and nothing is sent.
3. `onUpdate(id, name.trim())` calls `editDuty` in the hook, which calls `updateDuty` in the service.
4. `apiRequest` sends `PUT /duties/:id`. If the response is not `ok`, it throws an `Error` with the backend message.
5. With a successful response, the hook replaces that duty in the list and sorts it again. React re-renders **without reloading the page or fetching the list again**.
6. `DutyItem` leaves edit mode. If the request failed, it stays in edit mode and shows the error.

---

## State management

All the list state lives in one custom hook, `useDuties`, built only with `useState` and `useEffect` (no Redux, no `useReducer`, no context), as required by the brief.

```ts
const { duties, loading, error, addDuty, editDuty, removeDuty } = useDuties();
```

- The list is loaded once when the page mounts (`useEffect` with `[]`).
- Updates use the functional form `setDuties((current) => ...)`, so two requests finishing close together never overwrite each other with an old list.
- State is never mutated: new arrays are created with spread, `map` and `filter`.
- The list is updated with the **server response**, not optimistically, so it always matches the database.
- `addDuty`, `editDuty` and `removeDuty` do not catch errors on purpose: they let them reach the component that started the action, which shows them in the right place.

Each `DutyItem` keeps its own small state (editing, name being typed, saving, deleting, error), so editing one duty does not affect the others. The list uses `key={duty.id}` so that state stays with the right duty when the list is re-sorted.

---

## Forms and validation

The same rule is used when creating and editing (`src/utils/validateDutyName.ts`):

```ts
export const dutyNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a duty name')
  .max(MAX_NAME_LENGTH, `Use ${MAX_NAME_LENGTH} characters or fewer`);
```

- Empty names and names with only spaces are blocked before calling the API.
- Inputs have `maxLength={200}`, and the name is sent trimmed.
- **No double submissions:** while a request is running the button is disabled and shows *Adding...*, *Saving...* or *Deleting...*, and the submit function also returns early (this covers pressing Enter).
- Deleting asks for confirmation with `window.confirm`.
- The backend validates the same rules again: the client check is for a fast user experience, the server check is the one that protects the data.

---

## Error handling

`services/api-client.ts` handles the three ways a request can fail:

| Case | What the user sees |
|---|---|
| Backend down or no network (`fetch` rejects) | *Could not connect to the server* |
| HTTP error (4xx/5xx), which `fetch` does **not** treat as a failure | The message sent by the backend, e.g. *Duty not found* |
| Error response without JSON | *Something went wrong, please try again* |

Where the message appears depends on what failed: a loading error is shown as a banner at the top of the page, while create, edit and delete errors appear right under the form or the duty that caused them.

---

## UI and accessibility

- Native `<form>`, `<input>`, `<button>`, `<ul>` and `<li>` elements, so Enter submits forms and screen readers understand the list.
- Icon-free buttons with visible text. Buttons repeated on every row have an `aria-label` with the duty name (*Edit Review pull requests*), which also lets tests target a specific row.
- Error messages use `role="alert"` so they are announced when they appear.
- Visible focus styles for keyboard navigation (`:focus-visible`).
- Colours and spacing are defined once as CSS variables in `global.css`.
- Responsive: under 560 px the form stacks vertically and the row buttons move under the name.

---

## Tests

```bash
npm test --workspace frontend
```

| File | Tests | What it covers |
|---|---|---|
| `__tests__/App.test.tsx` | 4 | Loading error banner; creating, editing and deleting update the list; editing does not fetch the list again |
| `__tests__/components/CreateDutyForm.test.tsx` | 5 | Empty and blank names blocked, trimmed name sent and input cleared, API error shown, only one request while saving |
| `__tests__/components/DutiesList.test.tsx` | 3 | List, empty and loading states |
| `__tests__/components/DutyItem.test.tsx` | 7 | Edit with trim, blank name blocked, API error on save, cancel; delete when confirmed, nothing when cancelled, API error on delete |
| `__tests__/services/duty.service.test.ts` | 7 | URLs and methods, `204` without body, backend error message, non-JSON error, network failure |
| `__tests__/utils/validateDutyName.test.ts` | 5 | Empty, blank, too long, spaces around a valid name, valid name |

Notes on the setup:

- Tests use **React Testing Library** with `jsdom` and query elements the way a user finds them (text, labels).
- `App.test.tsx` mocks the whole `duty.service`, so page flows run without network and errors can be forced.
- `window.confirm` is replaced with `jest.spyOn(window, 'confirm').mockReturnValue(true | false)`.
- `jest.config.js` maps `config/env` to `config/__mocks__/env.ts`, because `import.meta.env` only exists in Vite.
- `clearMocks: true` resets call counts between tests.

---

## Adding a new feature

Example: projects.

1. `types/project.ts` with the interface.
2. `services/project.service.ts` with one function per endpoint, reusing `apiRequest` (URL, headers and error handling come for free).
3. `hooks/useProjects.ts` following the same pattern as `useDuties`.
4. `components/projects/` for the form and the list, plus their tests.

---

## Next steps for the frontend

- When the list fails to load, hide the *No duties yet* message under the error banner (today both are shown).
- Merge custom headers in `apiRequest` instead of overwriting them, before any service needs to send one.
- Cancel the initial request with `AbortController` if the page unmounts.
- A custom confirmation dialog instead of `window.confirm`, and a retry button for the loading error.
- Optimistic updates so changes appear before the server answers, rolling back on error.
- Refresh the list periodically or with a button, since changes made by other users only appear after reloading.
- A few end-to-end tests with Playwright against the real backend.
