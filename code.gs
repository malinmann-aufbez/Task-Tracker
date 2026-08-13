/**
 * Task-Tracker → Update-Agent — Apps-Script-Proxy
 * ------------------------------------------------
 * Diese Web-App läuft unter DEINEM Google-Konto und hat damit automatisch
 * Zugriff auf dein Task-Tracker-Sheet – ganz ohne Service Account oder
 * Google-Cloud-Konsole.
 *
 * Aufgabe: Das Sheet authentifiziert als XLSX exportieren und base64-kodiert
 * zurückgeben. Der GitHub-Agent liest daraus die Zeilen (inkl. Smartchip-Links).
 *
 * Setup-Schritte stehen in der README.md. Kurz:
 *   1) SHEET_ID und TOKEN unten anpassen.
 *   2) Bereitstellen → Neue Bereitstellung → Web-App
 *      - Ausführen als: Ich (dein Konto)
 *      - Zugriff: Jeder / Anyone
 *   3) Web-App-URL kopieren → als GitHub-Secret APPS_SCRIPT_URL hinterlegen.
 */

// ====== ANPASSEN ======
var SHEET_ID = '1IwN9I_SYDsMeZ2R7YTjYyGsdWkgI-M3BzsGRIl6bDjY';
// Frei wählbares, geheimes Passwort. IDENTISCH als GitHub-Secret APPS_SCRIPT_TOKEN hinterlegen.
var TOKEN = 'HIER-EIN-LANGES-ZUFALLS-PASSWORT-EINSETZEN';
// ======================

function doGet(e) {
  try {
    var token = (e && e.parameter && e.parameter.token) || '';
    if (token !== TOKEN) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Authentifizierter XLSX-Export des Sheets. Beim Export werden Smartchips
    // automatisch zu Zellen mit Hyperlink – genau das, was wir brauchen.
    var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=xlsx';
    var resp = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });

    if (resp.getResponseCode() !== 200) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'export_failed', code: resp.getResponseCode() }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var b64 = Utilities.base64Encode(resp.getBlob().getBytes());
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, xlsx_base64: b64 }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
