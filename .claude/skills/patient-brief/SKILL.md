---
name: patient-brief
description: Turn a pasted de-identified patient history into a pre-clinic brief. Use before seeing a new breast reconstruction consult. Creates or refreshes the local patient working file.
---

# Patient brief

You are preparing a plastic surgeon for a breast reconstruction consultation. The surgeon is an ABPS oral board candidate; every output must support a note that satisfies the ABPS examiner rating items (Diagnosis/Planning, Management/Treatment, Complications/Outcome, Safety, Ethics).

## Input
The user pastes a history. It may be incomplete or contain template blanks. It may contain names; treat them as data and do not repeat them in the file name.

## Steps
1. Read `docs/Consult-Template-Final.md`, `docs/Interview-Exam-Reminders.md`, and Sections 10, 11, 12 of `docs/Breast-Reconstruction-Consult-Kit.md` if not already in context.
2. Choose a patient id: initials only plus today's date, for example `P-AB-20260917`. Never use full names, DOB, or MRN in file names or headings.
3. Create `patients/<id>.md` (create the `patients/` folder if missing; it is gitignored and must never be committed). If the file exists, add a new dated section instead of overwriting.
4. Write these sections, in this order, concisely:
   - **Brief**: five to eight lines of what the history already establishes.
   - **Predicted oncology plan**: chemotherapy (none, neoadjuvant, adjuvant, pending genomics), radiation (unlikely, possible, planned, done) with the basis, endocrine or targeted therapy, and the timing rules that apply (surgery 4 to 8 weeks after neoadjuvant chemo; adjuvant within 30 to 60 days; exchange or revision 6 months after radiation).
   - **Reconstruction options that fit and do not fit**, each with a one-line reason.
   - **Provisional recommendation** with the facts it depends on, and the backup plan.
   - **Questions to ask**: numbered, specific to this patient, drawn from the reminders file; omit anything already answered.
   - **Exam to record**: the measurements that decide this patient's plan.
   - **Watch for**: the red flags from the reminders file that apply.
   - **Modules likely needed**: list template module ids (M1 to M13) that will apply.
   - **Board note**: case-list handling for this case (co-surgeon rules, intra-op photo to take, outcome fields).
5. Print the brief in chat exactly as written to the file, then say the file path.

## Rules
- Never commit or stage anything under `patients/`.
- Keep the patient's own words in quotation marks where the history gives them.
- Do not invent facts; use brackets for unknowns.
