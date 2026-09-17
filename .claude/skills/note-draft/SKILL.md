---
name: note-draft
description: Produce the copy-paste assessment and plan for a patient from their working file, using the surgeon's template and voice. Use when sitting down to write the note.
---

# Note draft

## Input
Arguments may arrive on the same line as the command or in the next message; ask once only if nothing is present.
A patient id (or initials). Optionally, last-minute facts to include.

## Steps
1. Read `patients/<id>.md` (all sections, latest update wins) and `docs/Consult-Template-Final.md`.
2. Build the note from the template:
   - Part 3 assessment items 1 to 5, filled from the file (item 5 names every consultant report with its date and the trial status).
   - Part 4 paragraphs A through K in order, using the fixed practice lines from Part 2.
   - Insert only the Part 6 modules the file says apply (M14 opens every note; M15 in every mastectomy note; M16 in autologous notes; M17 in implant notes; M18 in lumpectomy with oncoplastic reduction; M19 when prior surgery closes a flap option); delete every module and every risk item for a modality the patient is not receiving.
   - Insert the Part 5 risk lists for the chosen pathway into paragraph C.
   - Keep the surgeon's voice exactly as the template is written: first person past tense for what the surgeon did; "Patient verbalized understanding..." for responses; explicit "if... then..."; sentences of 20 to 35 words in prose.
3. Leave `[ ]` for any fact the file does not contain. Do not guess.
4. Run the Part 7 consistency check on your own draft before printing: laterality, mastectomy type, nipple decision, reconstruction type, and staging must agree in every paragraph.
5. Print the note in a single fenced code block so it can be copied in one motion, followed by a short list titled **Blanks to fill before signing**, then a second short fenced block titled **Case Log fields (tracker, not note text)** with the Part 8 items filled for this patient.
6. Save the draft to `patients/<id>.md` under `## Note draft <date>`.

## Rules
- Output the note only once, in the code block; do not paraphrase it afterward.
- Never commit or stage anything under `patients/`.
