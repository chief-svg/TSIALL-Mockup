# ABPS Oral Boards Prep: Handoff and Summary

**Last updated:** September 17, 2026 (evening). Continue from here in Claude Code desktop.
**Branch:** `claude/plastic-surgery-boards-checklist-du429b` (all work committed and pushed).

## Who and what

Plastic surgeon (chief@stentandsculpt.com) in the ABPS case collection period **July 1, 2026 to March 31, 2027**, independent practice started mid-September 2026, first clinic September 17, 2026 (3 immediate breast reconstruction consults, 1 delayed). Target: **November 11 to 13, 2027 Oral Examination**.

The certifying body is the **American Board of Plastic Surgery (ABPS)**, not ASPS. Every requirement was verified against the ABPS 2026-2027 Booklet of Information Oral Exam section (pages 37 to 62, supplied as a PDF) and ABPS candidate web pages.

## Files in this folder

| File | What it is |
|---|---|
| `00-START-HERE.md` | This handoff. |
| `Concerns-Assessment.md` | The six concerns your questions revealed, each rated for real risk, with the fix and a priority order. Read this second. |
| `ABPS-Oral-Boards-Compliance-Protocol.md` | The master protocol. Part A: every ABPS requirement and date. Part B: per-patient checklist. Part C: clinic note standard. Part D: evidence-based timing and optimization thresholds. Part E: cadence. |
| `Breast-Reconstruction-Consult-Kit.md` | Clinic kit: chart review, scribe brief, in-room flow, measured exam, decision framework, risk language, scribe-ready template, sign-off check (Sections 1 to 9); chemo and radiation prediction model and what to change when radiation is coming (Section 10); autologous versus implant evidence with MROC and MSKCC numbers (Section 11); nipple-sparing mastectomy with immediate DIEP in a ptotic breast, including the grade 3 plan without staged mastopexy or nipple delay (Section 12 and 12a); Caprini quick reference (Section 13). |
| `Oncology-Timing-Algorithm.md` | Mermaid flowcharts and timelines: subtype to reconstruction, radiation decision tree, four calendar pathways, option-by-radiation matrix, waiting intervals, counseling lines. Published page: https://claude.ai/artifact/ANsVZbRpEoWBsg9fzhCMy6 |
| `Note-Review-Log.md` | De-identified reviews of nine colleague consult notes (Providers A, B, C), reusable language, fourteen recurring failure patterns, ten template rules, and the practice defaults the user confirmed. |
| `Consult-Template-Final.md` and `.pdf` | v1.3. The consolidated assessment-and-plan template in the user's voice: style rules, fixed lines, assessment block, eleven plan paragraphs, three risk lists, thirteen modules, sign-off check. Published page: https://claude.ai/artifact/LNb9JXD6C6zkEXxwuwUMxh |
| `BOI-Coverage-Map.md` | Every requirement in the 2026-2027 Booklet Oral Exam section (pages 37 to 62) mapped to the template part, reminder, skill, or protocol section that carries it, with what was added on September 17 and two items to confirm with the practice. |
| `STANDING-INSTRUCTIONS.md` | The contract for any new session: outputs, two-document format, voice rules with the five anchor sentences, fixed practice lines, ABPS rules, evidence, failure patterns, privacy. Read first. |
| `Portable-Context-Pack.md` | Standing instructions plus template, reminders, and evidence in one file to paste into a chat session without file access. |
| `Global-CLAUDE-snippet.md` | Block to paste into `~/.claude/CLAUDE.md` on the laptop so every session knows the workflow. |
| `Clinic-Workflow.md` and `Interview-Exam-Reminders.md` | Laptop workflow: four Claude Code commands (`/patient-brief`, `/patient-update`, `/note-draft`, `/note-check`) in `.claude/skills/`, local gitignored `patients/` folder, and the reminder reference the commands read. |
| `ABPS-Boards-Prep-Complete.md` | All markdown files concatenated into one for reading or sending. Regenerated September 17, 2026 (evening). |

Published pages (private, checkboxes save per browser):
- Protocol page: https://claude.ai/artifact/F6VVvajeUBdLN5vbPqDegf
- Consult kit page: https://claude.ai/artifact/5K2BmFbfxD95u6nn5V5DFR (does not yet include Sections 10 to 13; the markdown is current)

## The ten facts that drive everything

1. Enter **every** operative case July 1 to March 31 at every facility; at least **50 must be Major** (auto-classified by CPT); **max 3 cases per patient** count. Affidavit: "ALL of my cases."
2. **Pre-op, intra-op, and post-op photos of every case**, including minor, office, ER, and hand. Intra-op means after incision and before closure. Post-op at **90 days or more**, preferably taken by you.
3. **In-person visit at least the day before surgery** for non-emergent cases; in-person post-op **within 30 days**; telemedicine only in between.
4. ABPS records and photo consent with the Board's verbatim language on every patient.
5. **Peer evaluations** from chiefs of surgery, staff, anesthesia, and OR nursing at each facility plus two ABPS surgeons, around April 1, 2027.
6. Case list package **physically received April 20, 2027**; late window April 21 to 23. Candidate Affidavit signed, not notarized; **one notarized Medical Records affidavit per facility**, including zero-case facilities.
7. Advertising April 2026 to April 2027 plus CV submitted; "Board Eligible" only after application approval; never "board certified."
8. July 2027: 5 selected cases and Registration (due July 31). **Case reports (11 tabs) finalized August 19, 2027, noon Eastern**; extra-case requests by August 16 are final.
9. Rating items: Diagnosis/Planning, Management/Treatment, Complications/Outcome, Safety, Ethics/Professionalism, Case Report Organization. Pass requires one clear safe plan you can defend plus a backup.
10. Outcome at 4 to 6 weeks and 30-day mortality on every entry; oral antibiotics, extra visits, and prolonged dressings are adverse events.

## Clinical rules of thumb captured

- Surgery 4 to 8 weeks after neoadjuvant chemo; adjuvant chemo within 30 to 60 days; bevacizumab 28-day holds; tamoxifen 28-day hold before free flaps as a shared decision; no hold for checkpoint inhibitors or aromatase inhibitors.
- Radiation: 4+ nodes always; 1 to 3 macrometastatic nodes usually; ypN+ yes; ypN0 usually no. Expander exchange 6+ months after radiation; delayed autologous at 6 to 12 months avoiding the 3 to 6 month window.
- Autologous versus implant: failure with radiation 18.7 versus 1.0 percent (MROC); DIEP total loss under 2 percent; radiated implant contracture 15 to 50 percent; autologous satisfaction higher at every time point over 8 years.
- Ptotic NSM with DIEP and no staged mastopexy or nipple delay: lateral inframammary incision, buried DIEP, nipple left in place with ICG-guided fallback to free graft or excision, mastopexy at 3 to 6 months.
- Caprini: not a Board requirement, but score every sedation or general anesthesia patient with the plan attached; breast reconstruction patients start at 4.
- Practice defaults: bilateral DIEP 6 to 8 hours, at least 2 nights, 6 to 8 weeks recovery; expander plane decided intraoperatively on flap thickness, ICG perfusion, pectoralis integrity, breast size, expected radiation, and patient risk factors; risks listed in every note with a plan; A1C only for diabetics; expander or direct-to-implant case 3 to 4 hours with 23-hour observation; Wise-pattern versus skin-sparing for grade III flap patients discussed with the breast surgeon case by case.
- The colleague notes shared five failure patterns worth remembering: template text contradicting the history, boilerplate "chemotherapy between stages" in flap and neoadjuvant plans, no adjuvant estimate or oncologist named, no risk block or alternatives, and comorbidities recorded but never converted into a plan.
- Nicotine 4 weeks before and after; HbA1c under 8; mammogram at 40+ before elective breast surgery; FDA implant checklist; 5 L liposuction and 6-hour office OR limits.

## Where we stopped

**September 17, 2026, late.** The Booklet's Oral Exam section (the July 14 file, identical to the earlier copy) was re-read in full against the template, reminders, and skills. Result: the administrative requirements were already in the protocol; the note-level gaps were closed in template v1.2 (Part 3 item 5 records reviewed with consultant dates and trial status; Part 4 C prevention-and-treatment sentence; I orders with indications; J surgeon-owned follow-up and per-stage visits; K modeling software and witnessed consent; Part 7 same-day signing and addenda; new Part 8 Case Log fields decided at the consult), in the reminders (four new questions, four new mentions, Case Log fields, and the 4-to-6-week outcome documentation), and in the four skills. The map is `BOI-Coverage-Map.md`.

**September 18, 2026.** Patient 1 was seen; the dictation was converted into the template and returned in chat (not stored in the repo). A fourth colleague's templates (Provider D) were reviewed and folded into template v1.3 as modules M14 to M17 (opening, mastectomy and nipple counseling, DIEP procedure explanation, implant procedure explanation) with additions to the risk lists and exam; the review and the rejected items are in `Note-Review-Log.md`. Patients 2 to 4 notes are still to come.

Evening of September 17, 2026. Nine colleague notes were reviewed and logged, the user supplied five sentences in their own voice, and the consolidated template was written around them (`Consult-Template-Final.md`). The user has read the template and approved it ("looks good"). The patient-by-patient review with pre-filled notes has not happened yet. Agreed workflow when it does:
- Send patients as Patient 1 to 4 with initials only; no names, DOB, MRN, or exact dates.
- Per patient: one-line summary and breast surgeon's plan; pathology and receptors; imaging with tumor-to-nipple distance; genetics; systemic therapy status and dates; radiation status; tumor board note; risk factors; patient goals.
- Return per patient: pre-filled note in the kit's template, questions still to ask, exam findings that decide the plan, draft assessment and plan with recommendation, backup, and risk block, and a board note if relevant.
- **Do not commit patient-specific content to the repo.**

## Open items

- Any template paragraph the user wants re-voiced: quote it and rewrite; conform the rest to the seven style rules in Part 1.
- Load the template into the practice's scribe system; run the sign-off check (Part 7) on the first five notes.
- Set up the laptop workflow per `docs/Clinic-Workflow.md`; Patients 1 and 2 briefs from September 17 exist only in the web chat and should be re-run locally with `/patient-brief`.

- Email oral@abplasticsurgery.org: 2026-2027 fee schedule, whether an employer start-date letter is wanted with the case list, case report webinar link.
- Update the practice photo consent with the ABPS language and a witness line (should be done before the first clinic).
- Confirm that every facility allows intraoperative photography, or request the waiver now (`BOI-Coverage-Map.md` Part D).
- Confirm surgery center accreditation and active admitting privileges before any sedation or general case; request an OR photography waiver if any facility restricts it.
- Build the tracker spreadsheet (twenty columns in the kit); can be generated as a workbook next session.
- Republish the consult kit page with Sections 10 to 13 if the phone version is wanted.

## How to continue on Claude Code desktop

```
git fetch origin claude/plastic-surgery-boards-checklist-du429b
git checkout claude/plastic-surgery-boards-checklist-du429b
```
Open Claude Code in the repo and say: "Read docs/STANDING-INSTRUCTIONS.md and docs/00-START-HERE.md, then continue." Laptop status as of September 17, 2026 (night): repository cloned, branch checked out, login working, global `~/.claude/CLAUDE.md` snippet installed, `/patient-brief` and `/patient-package` tested on Patient 1, and the chat backup path (Portable-Context-Pack) tested on Patient 2. All layers verified by the user. Patients 1 and 2 also have Summary and Consult Note PDFs built in the web session (not in the repository). The root `CLAUDE.md` points here automatically.
