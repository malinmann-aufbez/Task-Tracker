# Task-Tracker → tägliches Update (KI-Agent)

Dieser Agent liest dein Google-Sheet **„20260807_Task Tracker Malin"**, nimmt alle
Aufgaben mit **Spalte K = „Y"**, lässt daraus von **Gemini** ein Update in deinem
gewohnten Stil formulieren und schickt es dir **Mo–Fr um 17:50 Uhr** per **E-Mail**.

Pro Aufgabe werden übermittelt: **Thema (B)**, **Task (C)**, **Stand (F)**,
**Blocker/Notes (H)** und **Doc (J)** als klickbarer Link – Smartchips werden
automatisch in echte Links umgewandelt.

Der Agent läuft kostenlos über **GitHub Actions**. Du brauchst dafür drei Dinge:
1. einen **Gemini-API-Key**,
2. ein **Gmail-App-Passwort** (Mailversand),
3. eine kleine **Apps-Script-Web-App** als Brücke zum Sheet (kein Service Account nötig).

---

## Überblick der Bausteine

| Datei | Zweck |
|---|---|
| `generate_and_send.py` | Der eigentliche Agent (holt Daten, ruft Gemini, sendet Mail) |
| `apps_script/Code.gs` | Kleines Google-Apps-Script, das das Sheet an GitHub liefert |
| `style_samples.md` | Deine bisherigen Lisa-Updates als Stilvorlage (kannst du erweitern) |
| `.github/workflows/daily-update.yml` | Zeitsteuerung: Mo–Fr, 17:50 Berliner Zeit |
| `requirements.txt` | Python-Abhängigkeiten |
| `.env.example` | Vorlage für lokale Tests |

---

## Schritt 1 — Repository anlegen

1. Auf GitHub ein **neues, privates Repository** erstellen, z. B. `task-tracker-agent`.
2. Alle Dateien aus diesem Ordner hochladen (Struktur beibehalten, inkl. `.github/workflows/`).

---

## Schritt 2 — Apps-Script-Web-App einrichten (Zugriff aufs Sheet)

Ein einfacher API-Key reicht bei Google **nicht**, um dein privates Sheet zu lesen.
Das Apps-Script läuft dagegen unter deinem Konto und hat automatisch Zugriff.

1. Öffne dein Task-Tracker-Sheet → **Erweiterungen → Apps Script**.
2. Lösche den vorhandenen Code, füge den Inhalt von **`apps_script/Code.gs`** ein.
3. Ganz oben zwei Werte anpassen:
   - `SHEET_ID` ist bereits korrekt gesetzt.
   - `TOKEN` → ein **langes, zufälliges Passwort** einsetzen (z. B. 32 Zeichen). Merke es dir.
4. **Bereitstellen → Neue Bereitstellung → Typ: Web-App**
   - *Ausführen als:* **Ich** (dein Konto)
   - *Zugriff:* **Jeder** (Anyone) — nötig, damit GitHub die App aufrufen kann; der Token schützt sie.
   - Beim ersten Mal Google-Berechtigungen bestätigen.
5. Die angezeigte **Web-App-URL** (endet auf `/exec`) kopieren.

> Hinweis: Falls deine Organisation externen Zugriff auf Web-Apps sperrt und Schritt 4
> „Jeder" nicht zulässt, nutze stattdessen die **Service-Account-Variante** (siehe unten).

---

## Schritt 3 — Gemini-API-Key holen

1. Auf **https://aistudio.google.com/apikey** einen API-Key erstellen.
2. Key kopieren. (Das kostenlose Kontingent reicht für ein Update pro Tag locker.)

---

## Schritt 4 — Gmail-App-Passwort erstellen

Der Agent braucht ein eigenes Mail-Passwort (dein normales Login funktioniert nicht per SMTP).

1. Im Google-Konto **2-Faktor-Authentifizierung** aktivieren (falls noch nicht).
2. **https://myaccount.google.com/apppasswords** öffnen → neues App-Passwort erzeugen.
3. Das 16-stellige Passwort kopieren.

> Falls Aufinity (Workspace) App-Passwörter gesperrt hat, kannst du als Absender
> ein privates Gmail-Konto verwenden – die Mail geht ja an dich selbst. Alternativ
> einen anderen SMTP-Server über `SMTP_HOST`/`SMTP_PORT` konfigurieren.

---

## Schritt 5 — GitHub-Secrets eintragen

Im Repo: **Settings → Secrets and variables → Actions → New repository secret**.
Folgende Secrets anlegen:

| Secret | Wert |
|---|---|
| `APPS_SCRIPT_URL` | die Web-App-URL aus Schritt 2 |
| `APPS_SCRIPT_TOKEN` | dasselbe Token wie im Apps-Script |
| `GEMINI_API_KEY` | dein Gemini-Key aus Schritt 3 |
| `GMAIL_ADDRESS` | Absender-Adresse (das Gmail/Workspace-Konto) |
| `GMAIL_APP_PASSWORD` | das App-Passwort aus Schritt 4 |
| `RECIPIENT` | `malin.mann@aufinity.com` |
| `SHEET_ID` | *(optional, ist im Code hinterlegt)* |
| `GEMINI_MODEL` | *(optional, Standard: `gemini-2.5-flash`)* |

---

## Schritt 6 — Testen

1. Im Repo auf **Actions → „Task-Tracker Daily Update" → Run workflow**.
2. Für einen reinen Probelauf ohne Mail: Feld **dry_run** auf `true` setzen.
   Dann siehst du im Log den fertigen Update-Text, es wird aber keine Mail versendet.
3. Für einen echten Testversand: **dry_run** auf `false` lassen → du bekommst die Mail sofort
   (der manuelle Start ignoriert das Zeitfenster).

Ab dann läuft es automatisch **Mo–Fr um 17:50 Uhr** (Berliner Zeit, sommer- wie winterzeit-sicher).

---

## Wie der Zeitplan funktioniert

GitHub-Cron rechnet in UTC. Der Workflow startet zu **zwei** Zeiten (15:50 und 16:50 UTC).
Das Skript prüft die echte Berliner Uhrzeit und sendet **nur um 17:50** – dadurch stimmt
die Uhrzeit ganzjährig, egal ob Sommer- oder Winterzeit. Am Wochenende passiert nichts.

> GitHub kann geplante Läufe bei hoher Last um einige Minuten verzögern – das ist normal.

---

## Stil verbessern

Der Ton kommt aus **`style_samples.md`**. Dort stehen deine bisherigen Updates.
Füge einfach neue Updates hinzu (oder passe bestehende an), committe die Datei –
der Agent orientiert sich beim nächsten Lauf daran. So „lernt" er deinen Stil.

---

## Alternative: Google Service Account (statt Apps-Script)

Falls du lieber ohne Apps-Script arbeitest oder externer Web-App-Zugriff gesperrt ist:

1. In der **Google Cloud Console** ein Projekt anlegen, **Google Drive API** aktivieren.
2. Einen **Service Account** erstellen, einen **JSON-Key** herunterladen.
3. Das **Sheet für die Service-Account-E-Mail freigeben** (Leseberechtigung).
4. Den kompletten JSON-Inhalt als GitHub-Secret **`GOOGLE_SERVICE_ACCOUNT_JSON`** hinterlegen
   (dann `APPS_SCRIPT_URL` weglassen). Der Agent nutzt automatisch diesen Weg.

---

## Lokal testen (optional)

```bash
pip install -r requirements.txt
cp .env.example .env      # Werte eintragen
DRY_RUN=1 FORCE=1 python generate_and_send.py   # Vorschau ohne Mail
```
