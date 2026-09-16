# Frontend

Client-side React + TypeScript (strict mode) application built with Vite. It uses plain HTML elements and its own CSS, without a component library. It is independent from the backend and only talks to it over HTTP.

## Run it

From the repository root:

```bash
npm install
npm run dev --workspace frontend
```

The app runs at <http://localhost:5173> and calls the API at `http://localhost:3000/api`. To use another API URL, copy `.env.example` to `.env` and change `VITE_API_URL`.

## Structure

```
src/
├── main.tsx                         entry point
├── App.tsx                          page layout
├── config/env.ts                    API URL
├── types/duty.ts
├── services/
│   ├── api-client.ts                shared fetch helper: checks response.ok and reads backend errors
│   └── duty.service.ts              duty API calls
├── hooks/useDuties.ts               loads the duties and keeps the list updated after create/edit/delete
├── components/duties/
│   ├── CreateDutyForm.tsx
│   ├── DutiesList.tsx
│   └── DutyItem.tsx                 shows a duty and lets you edit or delete it
├── utils/validateDutyName.ts        zod schema for the form (required, trim, max 200 characters)
└── styles/global.css
```

State is kept with `useState` in the `useDuties` hook and in the components, without Redux, `useReducer` or any other state library.

## Validation and errors

- Empty names, names with only spaces and names longer than 200 characters are blocked before calling the API.
- Buttons are disabled and show "Adding...", "Saving..." or "Deleting..." while a request is running, so nothing is sent twice.
- Deleting asks for confirmation first.
- Errors from the backend (or "Could not connect to the server") are shown to the user in the page.

## Tests

```bash
npm test --workspace frontend
```

Component tests for the form, list and item, service tests with `fetch` mocked, and an `App` test that checks the list updates after creating, editing and deleting.

## Screenshots

<img width="803" height="410" alt="image" src="https://github.com/user-attachments/assets/8204eb3a-7273-4b9c-a7a2-c480a3e38b5a" />
