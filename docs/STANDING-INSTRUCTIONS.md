# Standing Instructions: Boards-Grade Breast Reconstruction Notes

Read this first in any new session, Claude Code or chat. It is the contract for how the surgeon and Claude work together during the ABPS case collection period and beyond.

## Who the user is

A plastic surgeon in independent practice since September 2026, in the ABPS oral board case collection period (July 1, 2026 to March 31, 2027), targeting the November 11 to 13, 2027 Oral Examination. Most consults are breast reconstruction referred by breast surgeons. The surgeon works with a scribe and an EMR, and has Claude open beside the EMR.

## What the user wants from every patient

When the user pastes a patient history (with or without a command), produce, in this order and in this format:

1. **Summary** of what is known, five to eight lines, stage and subtype stated plainly.
2. **What it means before the visit**: the predicted chemotherapy and radiation plan with the basis, the one oncologic fact that constrains reconstruction, radiation likelihood, and the timing rules that apply.
3. **Questions to ask**, at most 12, ordered by how much each answer changes the plan.
4. **What to document specifically**, split into history, exam as numbers, assessment, and plan.
5. **Suggested reconstruction plans**: usually two, with the decision rule between them, the nipple decision, the contralateral plan, and any gate on pending results.
6. **The consult note in sections** for copy and paste: reason for visit and HPI; oncologic history and timeline; past medical, surgical, medications, allergies; social and family history; review of systems; vitals and exam; data reviewed; assessment (four numbered items); plan (paragraphs A through K); before-signing check. In the assessment and plan, put a cue list beside each paragraph naming what can be added depending on what was discussed.
7. **Board note**: how the case enters the ABPS case list (co-surgeon rule, intra-op photo, outcome fields, three-per-patient cap).

Deliver as two documents when files are possible: a Summary (items 1 to 5 and 7) and a Consult Note (item 6). In chat without files, deliver both in the message with the note in code blocks.

## Voice and style (the user's own)

1. First person, past tense, for what the surgeon did: "I reviewed," "I explained," "I recommended."
2. The patient's response is its own sentence: "Patient verbalized understanding that..." "Patient wishes to proceed."
3. Conditions carry an explicit then: "If [ ], then [ ], and in that case [ ]."
4. Paragraphs open with sequence markers where they fit: "After discussion of the surgical options," "At the conclusion of the consultation."
5. Sentences close with purpose or contrast where it adds meaning: "in order to," "rather than risk a wound problem," "as well as."
6. Recurring nouns: surgical plan, surgical option, reconstructive goals, her concerns, a later stage, revision stage.
7. Plain sentences of 20 to 35 words, one idea each, in prose; the only list is inside the risk sentence.
8. No sentence may contradict the history, the exam, or another sentence. Delete education or consent text for any modality the patient is not receiving.

The five anchor sentences, verbatim:
- Options: "I reviewed the options with the patient, which included no surgical reconstruction with a flat closure or external prosthesis, delayed reconstruction after cancer treatment, implant-based reconstruction done in a one or two stage manner, and autologous reconstruction as well. For each surgical option I explained how it could or could not address her concerns and reconstructive goals."
- Borderline nipple: "The patient's anatomy raises my concern for nipple preservation. I explained that due to the anatomy the risk of losing part or all of the nipple is higher than usual. I explained that due to positioning her nipples will sit low after reconstruction and will likely need to be repositioned at a later revision stage in order to correct their position. I also explained that if the nipples look poorly perfused during surgery, then I will either convert them to a free nipple graft or remove them rather than risk a wound problem."
- Risks: "After discussion of the surgical options, I explained the risks of the surgery, specifically stating the risks of [list], as well as the alternatives to the surgical plan."
- Radiation: "I explained that if the final pathology of the specimen demonstrates a positive node, then radiation becomes likely, and in that case the expander will stay in place through radiation and be exchanged at a later stage, at least 6 months from the completion of radiation. Patient verbalized understanding that the need for radiation can change her expander fill and timing."
- Closing: "At the conclusion of the consultation, the patient verbalized her understanding of the plan back to me and stated that all of her questions had been answered. Patient wishes to proceed. Preoperative photographs were taken with the patient's consent."

## Fixed practice lines

- Bilateral DIEP: 6 to 8 hours, at least 2 inpatient nights, 6 to 8 weeks to full activity.
- Expander or direct-to-implant: 3 to 4 hours, 23-hour observation, 4 to 6 weeks.
- Expander plane decided intraoperatively on flap thickness, ICG perfusion, area of poorly perfused skin, pectoralis integrity, breast size and ptosis, expected implant volume, anticipated radiation, and patient risk factors; good flaps favor prepectoral with mesh, thin or marginal flaps favor subpectoral, lower fill, or a deflated expander.
- Wise-pattern versus skin-sparing for a grade III breast with a flap is discussed with the breast surgeon case by case.
- Risks listed in every note that offers a plan. A1C only for diabetics. Stages at least 3 months apart; definitive stage at least 6 months from the completion of radiation.

## What ABPS requires of every case (the reasons behind the note)

- Every operative case entered; at least 50 Major; at most 3 per patient count.
- Pre-op, intra-op (after incision, before closure), and post-op photos at 90 days or more for every case, taken by the surgeon where possible; ABPS records and photo consent with the Board's verbatim language.
- In-person visit at least the day before surgery; in-person post-op visit within 30 days; telemedicine only in between.
- Outcome at 4 to 6 weeks and 30-day mortality on every entry; oral antibiotics, extra visits, and prolonged dressings are adverse events.
- Examiners grade Diagnosis/Planning, Management/Treatment, Complications/Outcome, Safety, Ethics/Professionalism, and Case Report Organization. Passing requires one clear safe plan you can defend, recognition of complications, and a backup plan. Failing includes an unsafe or ambiguous plan and coding deception.
- Immediate reconstruction with a breast surgeon is entered but not flagged as co-surgeon, with the surgeon's own operative report and bill and only the plastic surgery portion's duration.
- Every stage is its own case with its own in-person pre-op visit, consent, note with risks, and three sets of photographs; any overnight stay including 23-hour observation is inpatient; consultants' reports go in the Initial Evaluation tab, so each is named with its date; modeling-software images, if any, are submitted; notes are signed the same day and nothing in a selected case is edited after the July 2027 notice without listing it on the EMR attestation.
- The template's Part 8 lists the Case Log fields to set at the consult; the full requirement-by-requirement map is `docs/BOI-Coverage-Map.md`.

## Evidence the notes cite

- Radiation: 4 or more nodes always; 1 to 3 macrometastatic nodes usually; ypN+ after neoadjuvant yes; ypN0 usually no. Reconstruction failure with radiation 18.7 percent implants versus 1.0 percent flaps (MROC). Expander exchange at least 6 months after radiation; delayed autologous at 6 to 12 months avoiding the 3 to 6 month window.
- Chemotherapy: triple negative at cT1c or larger and HER2-positive at cT2 or larger get neoadjuvant therapy; surgery 4 to 8 weeks after the last cycle; adjuvant chemotherapy within 30 to 60 days of surgery; T1a HER2-positive is surgery first with adjuvant paclitaxel and trastuzumab considered. DCIS: sentinel node at mastectomy, about 1 in 5 upstaged, no radiation unless margin positive.
- Flaps: DIEP total loss under 2 percent, fat necrosis about 10 to 15 percent, bulge or hernia 2 to 5 percent, higher satisfaction at every time point (MROC, MSKCC). Implants: about 10 percent rupture by 10 years; contracture 15 to 50 percent with radiation; FDA boxed warning and Patient Decision Checklist required.
- Nipple-sparing: necrosis about 9 percent with inframammary incisions versus 18 percent periareolar; tumor-to-nipple over 2 cm, ptosis grade 2 or less, SN-N about 25 cm or less favor it.
- Optimization: nicotine 4 weeks before and after; HbA1c under 8; Caprini as a number with chemoprophylaxis at 7 or higher; mammogram at 40 and older before elective breast surgery; tamoxifen 28-day hold before a free flap as a shared decision; bevacizumab 28-day holds; no hold for trastuzumab, pembrolizumab, aromatase inhibitors.

## Failure patterns to avoid (learned from nine colleague notes)

Template text contradicting the history; education for options that do not apply; "chemotherapy between stage one and two" in flap or neoadjuvant plans; candidacy asserted without measurements; no adjuvant estimate or oncologist named; no risk block, alternatives, or benefits; comorbidities recorded but not planned for; hedges contradicting facts; plans committed before pending results; laterality stated two ways; measured findings ignored in the plan; blank vitals; no Caprini; no in-person pre-op, 30-day, or 90-day visits; no photographs or Board consent line.

## Privacy

Initials only in file names and headings. Patient files stay in the local `patients/` folder, which is gitignored, or in chat. Nothing patient-identifiable is committed to the repository.

## Where the full material lives

Repository branch `claude/plastic-surgery-boards-checklist-du429b`, folder `docs/`: `Consult-Template-Final.md` (the template, v1.2 with Part 8 Case Log fields), `BOI-Coverage-Map.md` (every Booklet requirement mapped to its prompt), `Interview-Exam-Reminders.md`, `Breast-Reconstruction-Consult-Kit.md` (Sections 10 to 13 hold the oncology model and evidence), `ABPS-Oral-Boards-Compliance-Protocol.md`, `Note-Review-Log.md`, `Oncology-Timing-Algorithm.md`, `Clinic-Workflow.md`. Commands in `.claude/skills/`: `/patient-brief`, `/patient-update`, `/note-draft`, `/note-check`, `/patient-package`. For a chat session without files, paste `docs/Portable-Context-Pack.md`.
