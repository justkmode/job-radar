# Job Radar

Job Radar collects LinkedIn job alert emails into a Google Sheet, so all the jobs
end up in one list instead of scattered across your inbox.

It is a small Google Apps Script that runs inside your own Google account.
Nothing is sent to any outside server.

## How it works

```
Gmail label "Job alerts"  →  Apps Script (daily)  →  Google Sheet, tab "Radar"
```

1. A Gmail filter puts LinkedIn job alert emails under the label **Job alerts**.
2. Once a day, the script searches that label for alerts from the last 14 days.
3. Each new email becomes one row in the **Radar** tab:

   | Received | Subject | Job links | Email text | Notes | Message ID |
   |---|---|---|---|---|---|

   - **Job links** are cleaned up to short `linkedin.com/jobs/view/<number>` links.
   - **Notes** is left empty for your own comments.
   - **Message ID** stops duplicates, so running the script twice adds nothing new.

Only emails from the addresses in `JOB_SENDERS` (at the top of `Code.js`) are counted.

## Setup

You need a Google account and [Node.js](https://nodejs.org/) for `clasp`,
Google's command-line tool for Apps Script.

1. **Gmail:** create a label called `Job alerts` and a filter that applies it to
   emails from LinkedIn job alerts.
2. **Sheet:** create a new Google Sheet.
3. **Script:** install clasp and connect this folder to a new script bound to that sheet:
   ```
   npm install -g @google/clasp
   clasp login
   clasp create --type sheets --title "Job Radar" --rootDir .
   clasp push
   ```
   `clasp create` makes a new sheet with a script attached. To use the sheet from
   step 2 instead, open it, go to **Extensions → Apps Script**, copy the script ID
   from **Project Settings**, and run `clasp clone <scriptId>` in an empty folder.
   `.clasp.json` holds your script ID and is git-ignored on purpose.
4. **First run:** in the Apps Script editor, run `collectJobAlerts` once and accept
   the permissions (Gmail read, Sheets).
5. **Daily run:** run `createDailyTrigger` once. The script then runs every morning
   around 08:00.

To change what gets collected, edit the settings at the top of `Code.js`
(senders, search, tab name) and run `clasp push` again.

## Next

- Let Claude rate each job and write the result in the **Notes** column.
- Add job alert senders beyond LinkedIn.
