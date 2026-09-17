---
name: patient-update
description: Update a patient's working file with interview findings, exam numbers, new results, or a changed plan. Use during or after the visit and whenever the situation changes.
---

# Patient update

## Input
Arguments may arrive on the same line as the command or in the next message; ask once only if nothing is present.
The user gives a patient id (or initials) and new information: answers from the interview, exam measurements, imaging or pathology results, oncology decisions, or a change in the patient's wishes.

## Steps
1. Open `patients/<id>.md`. If several files match the initials, list them and ask which.
2. Append a section headed `## Update <YYYY-MM-DD HH:MM>` containing:
   - **New information**: what changed, in the user's words where given.
   - **Effect on the plan**: what the new facts change about oncology sequencing, candidacy, nipple decision, donor site, timing, or risk; cite the rule from `docs/Breast-Reconstruction-Consult-Kit.md` Sections 10 to 13 or `docs/ABPS-Oral-Boards-Compliance-Protocol.md` Part D when a threshold is involved.
   - **Revised recommendation** and backup plan, or "unchanged."
   - **Remaining questions** still unanswered from the brief.
   - **Modules now needed** (template module ids).
3. Update the **Provisional recommendation** section at the top of the file to match, marking it `(revised <date>)`.
4. Print the update section in chat.

## Rules
- Never delete earlier sections; the file is a dated record of how the plan evolved.
- Never commit or stage anything under `patients/`.
- If a new fact contradicts an earlier one, say so explicitly and ask which is correct.
