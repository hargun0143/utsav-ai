# Utsav AI

A GenAI planning assistant for weddings, birthdays and community events. Enter an event type, budget, guest count, date and city, and Utsav AI returns a budget breakdown, a dated timeline, a vendor checklist and personalised ideas.

**Live demo:** https://utsav-ai-theta.vercel.app/

Built for the Google for Builders x Hack to Skill prompt war.

## Vertical

Celebration and event planning, with a focus on Indian events: budgets in rupees, local vendor types, and festivals and customs that affect timing.

## The problem

Planning an event means juggling a budget, a deadline, a long list of vendors and a lot of ideas, usually with no clear starting point. Most people overspend on one item, book vendors too late, or miss steps. Utsav AI turns a few details into a complete, realistic plan in seconds.

## Approach and logic

The model writes the creative content. The server controls everything that must be correct.

1. **Validate input** on the server (`shared/validateInput.js`). Bad budgets, guest counts, dates and event types are rejected with clear field errors before any model call.
2. **Build a structured prompt** (`api/_lib/buildPrompt.js`). A system instruction defines the planner's role and the exact JSON shape to return. The user's details go in as data.
3. **Call Gemini** with JSON output enforced.
4. **Normalise the result** (`api/_lib/normalizePlan.js`). The server does not trust the model's numbers:
   - budget categories are scaled so they add up exactly to the user's budget
   - timeline dates are computed from the event date and clamped to valid days
   - days until the event and cost per guest are calculated by the server, not the model
5. **Retry or fall back** if the model fails or returns invalid output, then render the plan.

## How it works

```
Browser (React)  ->  POST /api/plan  ->  validate  ->  build prompt
                                                          |
Plan UI  <-  normalise + verify  <-  Gemini (JSON output)
```

- Frontend: React 19 and Vite, plain CSS, no UI framework.
- Backend: one Vercel serverless function (`api/plan.js`).
- The API key lives only on the server.

## GenAI services used

- **Gemini API (Google AI)** through the REST `generateContent` endpoint, called only from `api/_lib/geminiClient.js`.
  - Primary model and fallback model are set through environment variables.
  - `systemInstruction` carries the planner role and output schema.
  - `responseMimeType: application/json` gives structured output.
  - Thinking level is set to low to keep plans fast.
- Gemini is used to generate the plan summary, budget category notes, timeline tasks, vendor checklist and personalised ideas.

## Features

- Event types: wedding, birthday and community events
- Budget donut chart with per-category amounts and notes
- Dated timeline counting back from the event day
- Vendor checklist and personalised ideas
- Animated landing page, circular reveal and WebGL background (written from scratch)
- Clear loading, error and retry states

## Assumptions

- Budgets are in Indian rupees, and costs are estimates, not quotes. Users should confirm prices with real vendors.
- The event date must be in the future.
- Plans are generated per request and are not stored. No accounts or user data are saved.
- The model gets only the details the user types into the form.

## Security

- The API key is never in the repository or the browser bundle. It is read from environment variables on the server only (`.env.local` locally, Vercel settings in production).
- Input is validated on the server, not only in the browser.
- Model output is validated and normalised before it reaches the UI.
- Responses are sent with `Cache-Control: no-store`.
- Raw model errors are logged on the server and are never sent to the user.

## Accessibility

- Every input has a label, and errors are tied to their fields.
- Status changes (loading, success, error) are announced to screen readers.
- Focus moves to the right heading after the reveal and after a plan is generated.
- Hidden layers use `inert` and `aria-hidden` so they cannot be reached by keyboard.
- Text meets a 4.5:1 contrast ratio.
- `prefers-reduced-motion` turns off the reveal animation and shows a still background.
- The layout works from small phone widths upward.

## Efficiency

- Thinking level low for fast responses.
- A fallback model when the primary model is rate limited, and retries only for temporary server errors.
- The WebGL background renders at half resolution and 30 fps, and pauses when the tab is hidden or the layer is closed.

## Testing

```
npm test
```

Uses the Node built-in test runner. The tests cover input validation, prompt building, plan normalisation (budget sums, date clamping, derived values) and error handling.

## Run locally

```
git clone https://github.com/hargun0143/utsav-ai.git
cd utsav-ai
npm install
cp .env.example .env.local
```

Add your own values to `.env.local`:

```
GEMINI_API_KEY=your_key
GEMINI_MODEL=your_primary_model
GEMINI_FALLBACK_MODEL=your_fallback_model
```

Then run:

```
npm run dev
```

## Project structure

```
api/            serverless function and server helpers
shared/         validation shared by client and server
src/            React app (components, hooks, styles, utils)
tests/          automated tests
```

## Limitations

- The free Gemini tier has low rate limits, so heavy use may briefly show a busy message.
- AI output can vary. The server fixes numbers and dates, but suggestions should still be reviewed by the user.
- Prices are estimates and not live market rates.


