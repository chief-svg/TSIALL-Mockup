---
name: note-check
description: Review a finished consult note for contradictions, ABPS board risks, missing template elements, and undocumented discussions. Use after editing the note in the EMR, before signing.
---

# Note check

## Input
Arguments may arrive on the same line as the command or in the next message; ask once only if nothing is present.
The user pastes the final note text (history, exam, assessment, plan), and optionally the patient id.

## Steps
1. Read `docs/Consult-Template-Final.md` (Parts 1, 5, 7), `docs/Note-Review-Log.md` (the "Recurring patterns" and "Rules for the final template" sections), and the patient file if an id is given.
2. Check, in this order, and report only findings:
   - **Contradictions**: laterality, mastectomy type, nipple decision, reconstruction type, staging, size goal, donor-site availability, smoking history, anything stated two ways. Quote both sentences.
   - **Board risks**: template text for a modality not being used; candidacy asserted without measurements; "chemotherapy between stages" in a flap or neoadjuvant plan; no adjuvant estimate or oncologist named; no risk block, alternatives, or benefits; comorbidity recorded but not planned for; hedges that contradict facts; plan committed before pending results; measured findings ignored in the plan; pre-op orders without an indication; blank vitals; no Caprini number with a plan; no in-person pre-op, 30-day, and 90-day visits; no photographs or ABPS consent line.
   - **Missing template elements**: list any Part 4 paragraph (A to K) or applicable module absent from the note.
   - **Style drift**: sentences that break the seven style rules in Part 1; quote and rewrite.
3. Then ask **Did you discuss...** questions, numbered, for each item that a thorough note would carry but this note does not mention: for example nipple decision, radiation contingency, adjuvant window, contralateral counseling, genetics interpretation, expander plane factors, free nipple graft alternative, WHCRA coverage.
4. Offer a corrected version of only the paragraphs that need changing, in a fenced code block, in the surgeon's voice. Do not rewrite paragraphs that pass.
5. If a patient id was given, save the findings to `patients/<id>.md` under `## Note check <date>`.

## Rules
- Be specific: quote the sentence, name the problem, give the fix.
- Do not pad with praise; if a section passes, say "passes" in one word.
- Never commit or stage anything under `patients/`.
