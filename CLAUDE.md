# Job Radar

Google Apps Script bound to my "Job Radar" Google Sheet. It copies LinkedIn job alert
emails (Gmail label "Job alerts") into the "Radar" tab, one row per email, and runs
daily via a time trigger (`createDailyTrigger`).

- Code: `Code.js` (Apps Script, V8 runtime). Manifest: `appsscript.json`.
- `.claspignore` limits pushes to the Apps Script files only.

## Deploy
- Deploy = `clasp push`. Always ask me before pushing.
- **Never edit in the browser Apps Script editor.** This folder is the single source of truth.
  If I did edit in the browser, run `clasp pull` first, review the diff, and commit it
  before changing anything here, or `clasp push` will overwrite my browser edits.

## How I like to work
- Plan first, then small steps. Stop and ask when you need me.
- Add short notes where useful:
  - 👀 **Look at:** something in the code or output I should check myself
  - 📚 **Learn:** a concept explained simply
