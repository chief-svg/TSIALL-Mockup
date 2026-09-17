---
name: patient-brief
description: Turn a pasted de-identified patient history into a pre-clinic brief. Use before seeing a new breast reconstruction consult. Creates or refreshes the local patient working file.
---

# Patient brief

You are preparing a plastic surgeon for a breast reconstruction consultation. The surgeon is an ABPS oral board candidate; every output must support a note that satisfies the ABPS examiner rating items (Diagnosis/Planning, Management/Treatment, Complications/Outcome, Safety, Ethics).

## Input
The history may arrive as the argument on the same line as the command or in the next message. If no history is present in either place, ask for it once. It may be incomplete or contain template blanks. Remind the user, in one line, to strip names, dates of birth, and record numbers before pasting; if a name is present anyway, do not repeat it in the file name, headings, or the brief.

## Steps
1. Read `docs/Consult-Template-Final.md`, `docs/Interview-Exam-Reminders.md`, and Sections 10, 11, 12 of `docs/Breast-Reconstruction-Consult-Kit.md` if not already in context.
2. Choose a patient id: initials only plus today's date, for example `P-AB-20260917`. Never use full names, DOB, or MRN in file names or headings.
3. Create `patients/<id>.md` (create the `patients/` folder if missing; it is gitignored and must never be committed). If the file exists, add a new dated section instead of overwriting.
4. If the paste looks truncated (no past medical or surgical history, no social history, no family history, no reconstruction preference), say so in one line and ask for the rest before writing anything; write only when the user confirms that is all there is.
5. Write these sections, in this order. Total length about 700 words; this is read between patients on a phone.
   - **Read first**: five lines at most. Stage and subtype stated plainly (a 5 mm tumor is T1a; do not hedge). The one oncologic fact that constrains reconstruction. Radiation likelihood. The provisional recommendation in one line. The single most important unanswered question.
   - **Brief**: five to eight lines of what the history already establishes.
   - **Predicted oncology plan**: chemotherapy (none, neoadjuvant, adjuvant, pending genomics), radiation (unlikely, possible, planned, done) with the basis, endocrine or targeted therapy, and only the timing rules that apply to this patient (surgery 4 to 8 weeks after neoadjuvant chemo; adjuvant within 30 to 60 days; exchange or revision 6 months after radiation). Keep oncology detail to what changes the reconstruction; do not list regimens or trials that do not apply.
   - **Reconstruction options that fit and do not fit**, each with a one-line reason.
   - **Provisional recommendation** with the facts it depends on, and the backup plan.
   - **Questions to ask**: at most 12, numbered, ordered by how much each answer changes the plan, specific to this patient, drawn from the reminders file; omit anything already answered.
   - **Exam to record**: the measurements that decide this patient's plan.
   - **Watch for**: the red flags from the reminders file that apply.
   - **Modules likely needed**: list template module ids (M1 to M19) that will apply; M14 opens every note, M15 applies to every mastectomy note, M16 to autologous notes, M17 to implant notes, M18 to lumpectomy with oncoplastic reduction, M19 when prior surgery closes a flap option.
   - **Board note**: the Case Log fields from template Part 8 for this patient, each on one line: anesthesia type; admission status (overnight or 23-hour observation is inpatient); planned procedure in words with "free flap" or "microsurgical" where it applies; planned CPT codes with modifiers (bilateral as one code with -50) and estimated skin-to-skin duration of the plastic portion; Anatomy Breast, Category General Reconstructive; breast surgeon case entered but not flagged as co-surgeon; stages expected inside July 1, 2026 to March 31, 2027 (three per patient count); intraoperative photographs to take for each site and side; imaging to keep with dates; research protocol yes or no; modeling software yes or no.
6. Print the brief in chat exactly as written to the file, then say the file path. No preamble about tasks or tracking.

## Rules
- Never commit or stage anything under `patients/`.
- Keep the patient's own words in quotation marks where the history gives them.
- Do not invent facts; use brackets for unknowns.
