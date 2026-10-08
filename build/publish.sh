#!/usr/bin/env bash
# Publishes the checker to GitHub Pages - and refuses to while anything would make that a mistake.
#
#   build/publish.sh
#
# Refuses when:
#   - the Impressum or privacy policy still carry the [[ADRESSE]] placeholder. A German website without a
#     complete Impressum invites a formal legal warning (Abmahnung) with costs;
#   - any check of the official KoSIT test suite or the known-broken samples gives a wrong verdict;
#   - the working tree has changes that are not committed, so what goes live is exactly what was tested.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="rmandera/e-invoice-checker"

if grep -rl "\[\[ADRESSE\]\]" docs >/dev/null; then
  echo "REFUSED: the postal address is still missing in:" >&2
  grep -rl "\[\[ADRESSE\]\]" docs >&2
  exit 1
fi

[ -d test/kosit/instances/standard ] || { echo "REFUSED: official test suite missing (test/kosit)" >&2; exit 1; }
node test/run-official.cjs || { echo "REFUSED: verification failed" >&2; exit 1; }

if [ -n "$(git status --porcelain)" ]; then
  echo "REFUSED: uncommitted changes - commit them so what is published is what was tested" >&2
  git status --short >&2
  exit 1
fi

if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --public --source . --remote origin \
    --description "Free XRechnung & EN 16931 validator that runs entirely in the browser"
fi
git push -u origin main

# Serve the docs/ folder of main. Creating Pages twice is an error, so update when it already exists.
if gh api "repos/$REPO/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/$REPO/pages" -f "source[branch]=main" -f "source[path]=/docs" >/dev/null
else
  gh api -X POST "repos/$REPO/pages" -f "source[branch]=main" -f "source[path]=/docs" >/dev/null
fi
echo "Published. Live in a minute or two at: https://rmandera.github.io/e-invoice-checker/"
