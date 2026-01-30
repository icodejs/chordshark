# Bugbot review guidelines – Chordio

Project-specific rules for Cursor Bugbot PR reviews. This repo is a React + TypeScript + Vite MIDI chord recognition app with theory in `src/theory/`, MIDI in `src/midi/`, and UI in `src/components/` and `src/app/`.

## Quality

- **Theory and recognition changes**: When changing code in `src/theory/` or chord recognition logic, ensure unit tests in `src/theory/chordTheory.test.ts` are added or updated as needed, and that they still pass.
- **Backend/theory changes** should generally include or update unit tests; flag PRs that modify `src/theory/` or chord behavior without corresponding test updates.

## Standards

- **React**: Flag deprecated React APIs (e.g. `componentWillMount`, `UNSAFE_` lifecycle methods). Prefer current React patterns and hooks.
- **Security**: Flag any use of `eval()`, `exec()`, or similar dynamic code execution unless clearly justified and safe.
- **TypeScript**: Expect strict TypeScript; flag loose `any` or unsafe type assertions where they introduce risk.

## Chordio-specific

- When changing **chord recognition** or files under `src/theory/`, ensure:
  - Tests in `src/theory/chordTheory.test.ts` are updated and still pass.
  - Recognition behavior (e.g. chord names, edge cases) is covered by tests where relevant.
- Changes to MIDI handling (`src/midi/`) or UI that affect recognition behavior should be consistent with existing theory and tests.

## Style (optional)

- If a changed file contains untracked `TODO` or `FIXME` comments (e.g. matching `/(?:^|\s)(TODO|FIXME)(?:\s*:|\s+)/`), add a non-blocking note: suggest replacing with a tracked issue reference (e.g. `TODO(#123): ...`) or removing the comment. If the TODO already references an issue (e.g. `#123` or `PROJ-456`), do not flag it.
