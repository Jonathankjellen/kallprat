# Kallprat

A fast, lightweight web application for discovering conversation starters and small talk topics — for everyday and professional settings.

Live at: [jonathankjellen.github.io/kallprat](https://jonathankjellen.github.io/kallprat/)

---

## About

**Kallprat** (Swedish for *small talk*) helps users quickly find ideas for starting conversations. Topics are organized into categories such as News, Sports, History, Technology, and General small talk. For each conversation starter, optional follow-up questions are provided to help keep the conversation going.

The application is fully static — no backend, no database, no login required.

---

## Features

- Browse conversation starters organized by category
- Randomize to get a new starter within the selected category
- View follow-up questions for each topic
- Fully responsive — works on mobile, tablet, and desktop
- Fast load time with no server communication after initial page load

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vite.dev/) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [gh-pages](https://github.com/tschaub/gh-pages) | GitHub Pages deployment |

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
src/
├── components/       # React components (Header, CategoryList, KallpratView, etc.)
├── data/
│   └── kallprat.json # Static conversation starter data
├── types/
│   └── index.ts      # TypeScript type definitions
├── App.tsx
└── main.tsx
```

---

## Data Format

Conversation starters are stored in `src/data/kallprat.json`. Each entry follows this structure:

```json
{
  "id": "unique-id",
  "category": "category-id",
  "text": "Conversation starter text",
  "followUpQuestions": [
    "Follow-up question 1",
    "Follow-up question 2"
  ]
}
```

---

## Deployment

The app is deployed to GitHub Pages automatically on every push to `main` via the workflow in `.github/workflows/deploy.yml`. It builds the project and publishes the `dist/` folder to the `gh-pages` branch.

You can also deploy manually:

```bash
npm run deploy
```

Ensure your repository's Pages settings are configured to serve from the `gh-pages` branch.

---

## Automated content refresh

Entries in the dynamic categories (`nyheter`, `sport`, `teknik`) are regenerated twice daily by `.github/workflows/refresh-kallprat.yml`, which runs `scripts/refresh.ts`. The script uses the OpenAI Responses API with web search to produce fresh Swedish conversation starters grounded in recent news, validates them against a Zod schema, and commits the updated `src/data/kallprat.json` back to `main`. The deploy workflow then republishes the site.

Evergreen categories (`historia`, `handelser`, `allmant`) are never touched. If generation fails for a category, the previous entries for that category are preserved.

**Required repo secret:** `OPENAI_API_KEY`.

**Local test:**

```bash
# PowerShell
$env:OPENAI_API_KEY="sk-..."; npm run refresh

# bash
OPENAI_API_KEY=sk-... npm run refresh
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
