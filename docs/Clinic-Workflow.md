# Clinic Workflow on Your Laptop

Claude Code desktop open on one half of the screen, the EMR on the other. Four commands carry a patient from referral to signed note. Patient files live in `patients/` inside this repo folder on your laptop, which is gitignored and never leaves your machine.

## One-time setup (5 minutes)

1. Install Claude Code desktop and sign in.
2. Clone this repository to your laptop and check out the branch:
   ```
   git clone <repo url>
   cd TSIALL-Mockup
   git checkout claude/plastic-surgery-boards-checklist-du429b
   ```
3. Open the folder in Claude Code desktop. The root `CLAUDE.md` loads the rules and the four commands appear when you type `/`.
4. Confirm `patients/` is listed in `.gitignore` (it is). Never run `git add patients`.

## The five commands

| When | Command | What you paste | What you get |
|---|---|---|---|
| Night before or between patients | `/patient-brief` | The referral history, de-identified (initials, no DOB or MRN) | A brief, the predicted chemo and radiation plan, which options fit, a provisional recommendation with backup, numbered questions to ask, the exam numbers to record, red flags, the template modules you will need, and the board note. Saved to `patients/P-XX-date.md`. |
| In the room or right after | `/patient-update P-XX` | Interview answers, exam numbers, the patient's stated goals, anything new | A dated update: what changed, what it does to the plan, the revised recommendation, questions still open. The file keeps every version. |
| Any later day | `/patient-update P-XX` | New pathology, oncology decision, a changed wish, a complication | Same. Use it every time the situation changes, through every stage. |
| At your desk writing the note | `/note-draft P-XX` | Nothing, or last-minute facts | The full assessment and plan in your voice inside one code block, ready to copy into the EMR, plus a list of blanks to fill. |
| Any time, or as the backup path | `/patient-package P-XX` (or paste a history) | Nothing, or the history | Two files in `patients/`: `P-XX-Summary` (summary, what it means, questions, what to document, two plans, board note) and `P-XX-Consult-Note` (the note in ten copy-paste sections with add-if-discussed cues beside the assessment and plan), as HTML that opens in the browser and as PDF when Chrome is installed. |
| Before signing | `/note-check P-XX` | The finished note text from the EMR | Contradictions quoted, board risks, missing paragraphs, style drift, then "Did you discuss..." questions, then corrected paragraphs only. |

## A clinic day

**Night before.** For each new patient, paste the referral into `/patient-brief`. Read the brief on your phone or laptop in the morning. Ten minutes for four patients.

**In the room.** Keep the brief open beside the EMR. Ask the numbered questions in order; dictate exam findings as numbers to the scribe. Say "for the record" before the options, the risks, and the patient's goals so the scribe captures them verbatim.

**Between patients, 60 seconds.** Paste the answers and measurements into `/patient-update`. The recommendation revises itself and the questions you skipped stay listed.

**At your desk.** Run `/note-draft`. Copy the code block into the EMR assessment and plan. Fill the blanks from the scribe's note. Delete any module that did not apply.

**Before signing.** Copy the whole note out of the EMR and paste it into `/note-check`. Fix what it quotes. Answer its "Did you discuss" questions honestly: if you did not discuss it, either add it at the pre-op visit and document it then, or leave it out. Sign within 24 hours.

**Pre-op visit, post-op visits, radiation, exchange.** Each visit is a `/patient-update`. When the case is selected for the Board, the file is the timeline you will need for the narrative summary.

## What the files look like

```
patients/
  P-AB-20260917.md     one file per patient, dated sections appended over time
  P-CD-20260917.md
```

Each file: Brief, Predicted oncology plan, Options, Provisional recommendation (revised dates), Questions, Exam to record, Watch for, Modules, Board note, then `## Update`, `## Note draft`, `## Note check` sections in the order they happened.

## Backup path when Claude Code is not available

Open a chat session, paste `docs/Portable-Context-Pack.md` (about 15,000 words: standing instructions, template, reminders, evidence), then paste the patient history and ask for the summary and the note. The output matches what the commands produce; save it yourself, initials only.

## Privacy rules

- Initials only in file names and headings. If a pasted history contains a name, the commands will not carry it into the file name; you should still strip names before pasting when practical.
- The `patients/` folder is excluded from git and stays on the laptop. Back it up with your other local clinical files, not through the repository.
- Do not paste patient content into the shared web session; use the desktop app on the laptop.

## Keeping the system current

- Template changes go in `docs/Consult-Template-Final.md`; the commands read it live, so an edit applies to the next note.
- New reminders go in `docs/Interview-Exam-Reminders.md`.
- New evidence or thresholds go in the consult kit or the protocol; the update command cites them.
