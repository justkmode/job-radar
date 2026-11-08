/**
 * Job Radar: copies LinkedIn job alert emails into this Google Sheet.
 * Runs inside your own Google account. Nothing is sent anywhere else.
 * Claude reads the sheet later through the Google Drive connector.
 */

// ---- Settings: change these, not the logic below ----
// The job senders: only emails from these addresses count. Add a new sender here.
const JOB_SENDERS = [
  'jobalerts-noreply@linkedin.com',
  'jobs-noreply@linkedin.com',
];
// Gmail search: only the "Job alerts" label, last 14 days, only the senders above.
// A label with a space is written with a dash in a search: "Job alerts" -> job-alerts
// The senders are joined with OR: (from:a OR from:b)
const SEARCH_QUERY =
  'label:job-alerts newer_than:14d ' +
  '(' + JOB_SENDERS.map(sender => `from:${sender}`).join(' OR ') + ')';
const SHEET_NAME = 'Radar';       // the tab the rows go into
const MAX_BODY_CHARS = 3000;      // keep each email text short and readable

/**
 * Main job: find new alert emails and add one row per email.
 * Safe to run many times: an email that is already in the sheet is skipped.
 * (That property is called idempotent: running twice = same result as once.)
 */
function collectJobAlerts() {
  const sheet = getOrCreateSheet_();

  // 1. Remember which emails are already saved (column F holds each email's unique ID)
  const lastRow = Math.max(sheet.getLastRow(), 2);
  const seenIds = new Set(
    sheet.getRange(2, 6, lastRow - 1, 1).getValues().flat().filter(String)
  );

  // 2. Find the alert emails in Gmail and build one row per NEW email
  const threads = GmailApp.search(SEARCH_QUERY);
  const newRows = [];

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const id = message.getId();
      if (seenIds.has(id)) return;          // already in the sheet -> skip, no duplicates

      const body = message.getPlainBody();
      newRows.push([
        message.getDate(),                  // A: when it arrived
        message.getSubject(),               // B: subject line
        extractJobLinks_(body).join('\n'),  // C: clean job links, one per line
        body.slice(0, MAX_BODY_CHARS),      // D: email text, shortened
        '',                                 // E: notes (my own, or Claude's rating)
        id,                                 // F: unique email ID, used for the duplicate check
      ]);
      seenIds.add(id);                      // also protects against duplicates within this run
    });
  });

  // 3. Write all new rows in one go (much faster than one row at a time)
  if (newRows.length > 0) {
    sheet
      .getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length)
      .setValues(newRows);
      sheet.getDataRange().setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP); // one line per row, full text on click
  }
  console.log(`Added ${newRows.length} new email(s).`);
}

/**
 * Pulls LinkedIn job links out of the email text and removes the tracking codes,
 * so each link is short and clean: https://www.linkedin.com/jobs/view/<number>
 */
function extractJobLinks_(text) {
  const matches = text.matchAll(/linkedin\.com\/(?:comm\/)?jobs\/view\/(?:[^\/?\s]*-)?(\d{6,})/g);
  const jobIds = [...matches].map(match => match[1]);
  return [...new Set(jobIds)].map(jobId => `https://www.linkedin.com/jobs/view/${jobId}`);
}

/**
 * Finds the 'Radar' tab, or creates it with column headers the first time.
 */
function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(['Received', 'Subject', 'Job links', 'Email text', 'Notes', 'Message ID']);
    sheet.setFrozenRows(1);               // header row stays visible when scrolling
  }
  return sheet;
}

/**
 * Run ONCE by hand: makes collectJobAlerts run automatically every morning around 08:00.
 * It first removes any old trigger, so you never end up with two (idempotent setup too).
 */
function createDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'collectJobAlerts')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('collectJobAlerts').timeBased().everyDays(1).atHour(8).create();
  console.log('Daily trigger created.');
}