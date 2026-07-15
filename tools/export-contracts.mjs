/**
 * Node tests import pure builders. Prefer the TS source via Node test + transpile is heavy;
 * keep a thin JS twin that re-implements by reading the .ts is not possible — duplicate import path:
 * tests import from ../src/lib/exportContracts.ts is not supported.
 *
 * So we keep a JS copy in sync: re-export from a .mjs sibling.
 * For CI, tests import this file which loads the compiled logic as plain JS copy.
 */
// Inline re-implementation is avoided: compile-free approach = copy JS file
export {
  TEACHING_DISCLAIMER,
  techniqueLabel,
  qualityWord,
  spectrumToCsv,
  labNoteMarkdown,
  clipboardMarkdownCitation,
  compoundBibtex,
  spectrumSourceBibtex,
} from './export-contracts-impl.mjs'
