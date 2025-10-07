Check Lists — simple mobile-first static web app

What this is
- A tiny static web app (HTML, CSS, JS) for making checklists shared between three named users: JH, JM, KH.
- No authentication. Select the active user at the top; that choice is remembered per browser via localStorage.
- Each checklist has per-user responses: yes/no and an optional note. The currently selected user can set their own response and note; other users' responses are read-only.
- Data persists in localStorage and a sample `data.json` file is included. You can Export to JSON and Import from JSON.

Files
- `index.html` — main UI
- `styles.css` — mobile-first styles
- `app.js` — app logic, persistence, import/export
- `data.json` — sample data

How to run
1. Open `index.html` directly in a browser for basic testing. Import may require a server for `fetch` to load `data.json` when localStorage is empty. To serve locally:

   # Windows PowerShell example
   python -m http.server 8000; Start-Process "http://localhost:8000"

   Or run the included persistence server which also accepts saves to `data.json`:

   # Run the tiny persistence server (serves files and persists data.json on PUT)
   python server.py

   Then open http://localhost:8000 in your browser.

2. Use the user selector at the top to switch users. Create checklists, add notes, and toggle yes/no for the selected user.

Export / Import
- Export creates a `checklists-export.json` file you can save.
- Import accepts a JSON file with the same shape (object with `lists` array). Import replaces current data.

Hosting on GitHub Pages
- This is a static site: push these files to a GitHub repository and enable GitHub Pages from the repository settings (use `main` or `gh-pages` branch). The site will be served over HTTPS and `data.json` will be fetchable.

Notes & next steps
- Currently all data lives in localStorage. For multiple-device sync, add a backend or use GitHub as storage (e.g., update a JSON file via a workflow or API).
- Consider adding per-list timestamps, edit UI, and confirmation for destructive actions.

License
- MIT
