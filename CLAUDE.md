# Project notes for Claude Code

This repository also holds ABPS oral boards preparation documents under `docs/`.
Before working on anything boards-related, read `docs/00-START-HERE.md` first; it summarizes the verified requirements, the files, and where the previous session stopped.

Rules for boards work:
- The certifying body is ABPS (abplasticsurgery.org); ASPS is the society. Verify requirements against the 2026-2027 Booklet of Information Oral Exam section.
- Never commit patient-identifiable content. Pre-filled patient notes stay in chat or in untracked local files.
- Keep the two detailed docs as the source of truth: `docs/ABPS-Oral-Boards-Compliance-Protocol.md` and `docs/Breast-Reconstruction-Consult-Kit.md`.

Clinic workflow (Claude Code desktop, laptop):
- Four commands: `/patient-brief`, `/patient-update`, `/note-draft`, `/note-check`. Their instructions are in `.claude/skills/`. Guide: `docs/Clinic-Workflow.md`.
- Patient working files live in `patients/` (gitignored). Never stage, commit, or push anything under `patients/`. Use initials only in file names and headings.
- The note template is `docs/Consult-Template-Final.md`; reminders are `docs/Interview-Exam-Reminders.md`.
