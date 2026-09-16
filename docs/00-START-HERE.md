# ABPS Oral Boards Prep: Handoff and Summary

**Last updated:** September 16, 2026 (web session). Continue from here in Claude Code desktop.
**Branch:** `claude/plastic-surgery-boards-checklist-du429b` (all work is committed and pushed here).

## Who and what

Plastic surgeon (chief@stentandsculpt.com) in the ABPS case collection period **July 1, 2026 to March 31, 2027**, started independent practice mid-September 2026, first clinic September 17, 2026 (3 immediate breast reconstruction consults, 1 delayed). Target: **November 11 to 13, 2027 Oral Examination**.

The certifying body is the **American Board of Plastic Surgery (ABPS)**, not ASPS. Every requirement in these files was verified against the ABPS 2026-2027 Booklet of Information Oral Exam section (pages 37 to 62, supplied by the candidate as a PDF) plus ABPS candidate web pages.

## Files in this folder

| File | What it is |
|---|---|
| `ABPS-Oral-Boards-Compliance-Protocol.md` | The master protocol. Part A: every ABPS requirement and date for this cycle. Part B: per-patient checklist. Part C: clinic note standard. Part D: evidence-based timing and optimization thresholds with sources. Part E: cadence. |
| `Breast-Reconstruction-Consult-Kit.md` | Tomorrow's clinic kit: chart review, scribe brief, in-room flow, measured exam, decision framework, risk language, scribe-ready template, sign-off check, board notes, and the chemo/radiation prediction model with the expanded "what to change when radiation is coming" section. |
| `00-START-HERE.md` | This file. |

Published pages (private, checkboxes save per browser):
- Protocol page: https://claude.ai/artifact/F6VVvajeUBdLN5vbPqDegf
- Consult kit page: https://claude.ai/artifact/5K2BmFbfxD95u6nn5V5DFR

## The ten facts that drive everything

1. Enter **every** operative case July 1 to March 31 at every facility; at least **50 must be Major** (auto-classified by CPT); **max 3 cases per patient** count toward 50. Affidavit: "ALL of my cases."
2. **Pre-op, intra-op, and post-op photos of every case**, including minor, office, ER, and hand. Intra-op means after incision and before closure. Post-op at **90 days or more**, preferably taken by you.
3. **In-person visit at least the day before surgery** for non-emergent cases; in-person post-op visit **within 30 days**; telemedicine only for intervening visits.
4. ABPS records/photo consent with the Board's verbatim language on every patient.
5. **Peer evaluations** (chiefs of surgery, staff, anesthesia, OR nursing at each facility, plus two ABPS surgeons) around April 1, 2027.
6. Case list package **physically received April 20, 2027**; late window April 21 to 23. Candidate Affidavit signed, not notarized; **one notarized Medical Records affidavit per facility**, including zero-case facilities.
7. Advertising from April 2026 to April 2027 plus CV submitted; "Board Eligible" only after application approval; never "board certified."
8. July 2027: 5 selected cases and Registration (due July 31). **Case reports (11 tabs) finalized August 19, 2027, noon Eastern**; extra-case requests by August 16 and they are final.
9. Exam rating items: Diagnosis/Planning, Management/Treatment, Complications/Outcome, Safety, Ethics/Professionalism, Case Report Organization. Pass requires one clear safe plan you can defend plus a backup plan.
10. Outcome at 4 to 6 weeks and 30-day mortality on every entry; oral antibiotics, extra visits, and prolonged dressings are adverse events. "All cases do not heal without complications."

## Clinical rules of thumb captured (Part D of the protocol and Section 10 of the kit)

- Surgery 4 to 8 weeks after neoadjuvant chemo; adjuvant chemo within 30 to 60 days of surgery; bevacizumab 28-day holds; tamoxifen 28-day hold before free flaps as a shared decision; no hold for checkpoint inhibitors or aromatase inhibitors.
- PMRT: 4+ nodes always; 1 to 3 macrometastatic nodes usually (SUPREMO may loosen this); ypN+ after neoadjuvant yes; ypN0 usually no (B-51). Expander exchange 6+ months after radiation; delayed autologous at 6 to 12 months avoiding the 3 to 6 month window; head and neck reconstruction within 6 weeks of prior radiation.
- Nicotine 4 weeks before and after; HbA1c under 8; Caprini as a number with chemoprophylaxis at 7+; mammogram at 40+ before elective breast surgery; FDA implant checklist; 5 L liposuction and 6-hour office OR limits.

## Where we stopped

The user planned to review the four clinic patients tonight and wanted pre-filled notes. Agreed workflow:
- Send patients as Patient 1 to 4 with initials only, no names, DOB, MRN, or exact dates.
- Per patient send: one-line summary and breast surgeon's plan; pathology and receptors; imaging with tumor-to-nipple distance; genetics; systemic therapy status and dates; radiation status; tumor board note; risk factors; patient goals from the referral.
- Return per patient: a pre-filled note in the kit's template format, the questions still to ask, exam findings that decide the plan, a draft assessment and plan with recommendation, backup plan, and risk block, and a board note if relevant.
- **Do not commit patient-specific content to the repo.** Keep pre-filled notes in chat or local untracked files.

## Open items

- Ask the Board Office (oral@abplasticsurgery.org): fee schedule for 2026-2027; whether an employer start-date letter is wanted with the case list; the case report webinar link.
- Confirm the four surgery centers' accreditation and that admitting privileges are active before any sedation or general case.
- Update the practice photo consent with the ABPS language before tomorrow's clinic.
- Build the tracker spreadsheet with the columns in the kit (could be generated as an .xlsx next session).

## How to continue on Claude Code desktop

```
git fetch origin claude/plastic-surgery-boards-checklist-du429b
git checkout claude/plastic-surgery-boards-checklist-du429b
```
Then open Claude Code in the repo and say: "Read docs/00-START-HERE.md and the two docs it lists, then continue with the patient review workflow." The root `CLAUDE.md` points there automatically.
