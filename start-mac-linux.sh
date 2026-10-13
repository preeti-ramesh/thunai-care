#!/bin/sh
# Opens Thunai Care on Mac or Linux.
#   In a terminal:   sh start-mac-linux.sh
cd "$(dirname "$0")" || exit 1

if command -v node >/dev/null 2>&1; then
  node scripts/serve.js
else
  echo "Node.js is not installed, so opening the single-file version instead."
  echo "Everything still works. To install Node.js later: https://nodejs.org"
  if command -v open >/dev/null 2>&1; then open thunai-care.html; else xdg-open thunai-care.html; fi
fi
