---
name: patient-package
description: Produce the two-document package for a patient (Summary and sectioned Consult Note with add-if-discussed cues) as HTML and, when Chrome is installed, PDF. Use after /patient-brief, or directly from a pasted history.
---

# Patient package

## Input
Arguments may arrive on the same line as the command or in the next message; ask once only if nothing is present. Either a patient id whose file exists in `patients/`, or a pasted history (in which case run the patient-brief logic first and save the file).

## Steps
1. Read `docs/STANDING-INSTRUCTIONS.md`, `docs/Consult-Template-Final.md`, and `docs/Interview-Exam-Reminders.md` if not already in context. Read `patients/<id>.md`.
2. Write `patients/<id>-summary.md` with: `# Patient <initials>: Summary`, then sections "Summary of what is known", "What this means before the visit", "Questions to ask" (at most 12), "What to document specifically" (history, exam as numbers, assessment, plan), "Suggested reconstruction plans" (usually two with the decision rule, nipple decision, contralateral plan, gate on pending results), "Board note".
3. Write `patients/<id>-note.md` with: `# Patient <initials>: Consult Note`, a one-line `> ` note explaining the blocks, then sections 1 to 10 in this order, each note section as a fenced ``` block: 1 Reason for visit and HPI; 2 Oncologic history and timeline; 3 Past medical, surgical, medications, allergies; 4 Social and family history; 5 Review of systems; 6 Vitals and physical examination; 7 Data reviewed; 8 Assessment (four numbered items, each preceded by a `::: cue Add if discussed` block listing what can be added); 9 Plan (paragraphs A to K from the template, each preceded by a `::: cue` block naming the options, lists, or modules that may be added); 10 Before signing (plain paragraph). Use the surgeon's voice and the five anchor sentences verbatim. Leave `[ ]` for unknowns. Include only modules that may apply, marked with their ids.
4. Run: `python3 .claude/skills/patient-package/build_package.py patients/<id>-summary.md patients/<id>-note.md patients/<id>` and report the files it prints. If PDFs were not produced (no Chrome), tell the user to open the HTML files and print to PDF with Cmd+P.
5. On macOS, run `open patients/<id>-Summary.html` and `open patients/<id>-Consult-Note.html` so they appear immediately.

## Rules
- Never commit or stage anything under `patients/`. Initials only in file names and headings.
- No preamble; print the file list and stop.
