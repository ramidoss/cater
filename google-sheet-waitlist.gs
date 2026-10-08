// Spind waitlist → Google Sheet
// Paste into Extensions → Apps Script of your sheet, then Deploy → New deployment → Web app
// Execute as: Me · Who has access: Anyone

const SHEET_NAME = 'Waitlist';
const HEADERS = ['Submitted at', 'First name', 'Last name', 'Work email', 'Company name', 'Number of employees', 'Offers benefits', 'Biggest challenge', 'Other challenge'];
const PERSONAL = ['gmail.com','googlemail.com','outlook.com','hotmail.com','yahoo.com','icloud.com','me.com','live.com','msn.com','aol.com','proton.me','protonmail.com','gmx.com'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const email = String(d.workEmail || '').trim().toLowerCase();
    const required = [d.firstName, d.lastName, email, d.companyName, d.companySize, d.offersBenefits, d.biggestChallenge];
    if (required.some(v => !String(v || '').trim())) return out({ ok: false, error: 'missing' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || PERSONAL.includes(email.split('@')[1])) return out({ ok: false, error: 'email' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); }

    const last = sh.getLastRow();
    if (last > 1) {
      const emails = sh.getRange(2, 4, last - 1, 1).getValues().flat().map(v => String(v).toLowerCase());
      if (emails.includes(email)) return out({ ok: false, error: 'duplicate' });
    }

    const clean = v => String(v || '').slice(0, 300).replace(/^[=+\-@]/, "'$&");
    sh.appendRow([new Date(), clean(d.firstName), clean(d.lastName), email, clean(d.companyName), clean(d.companySize), clean(d.offersBenefits), clean(d.biggestChallenge), clean(d.otherChallenge)]);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
