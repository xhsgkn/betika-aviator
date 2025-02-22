#!/bin/bash

CHROME="/opt/google/chrome/chrome"
DEBUG_PORT=9222
LOGFILE="chrome.log"

DEFAULT_PAGE="${1:-"chrome://new-tab"}"

echo "Killing any running Chrome..."
pkill -f "${CHROME} --headless"

  # --headless \
echo "Starting Chrome..."
$CHROME \
  --remote-debugging-port=9222 \
  --user-data-dir=chromedata \
  --start-maximized \
  $DEFAULT_PAGE \
  > $LOGFILE 2>&1 &
