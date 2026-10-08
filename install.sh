#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://raw.githubusercontent.com/88venom14/vpn-config-hy2/main/config-hy2.yaml"

DEST="${1:-}"

if [ -z "$DEST" ]; then
    echo "Usage:"
    echo
    echo "  sudo ./install.sh /path/to/config-hy2.yaml"
    echo
    exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    echo "ERROR: curl is not installed."
    exit 1
fi

DEST_DIR="$(dirname "$DEST")"

echo "Creating directory:"
echo "  $DEST_DIR"

sudo mkdir -p "$DEST_DIR"

TMP_FILE="$(mktemp)"

cleanup() {
    rm -f "$TMP_FILE"
}

trap cleanup EXIT

echo
echo "Downloading configuration..."
echo "  $REPO_URL"

curl -fsSL \
    --retry 3 \
    --connect-timeout 15 \
    --max-time 120 \
    "$REPO_URL" \
    -o "$TMP_FILE"

if [ ! -s "$TMP_FILE" ]; then
    echo "ERROR: downloaded file is empty."
    exit 1
fi

if [ -f "$DEST" ]; then
    BACKUP="${DEST}.bak.$(date +%Y%m%d-%H%M%S)"

    echo
    echo "Creating backup:"
    echo "  $BACKUP"

    sudo cp -a "$DEST" "$BACKUP"
fi

echo
echo "Installing configuration..."

sudo install -m 0644 "$TMP_FILE" "$DEST"

echo
echo "Configuration installed successfully:"
echo "  $DEST"
echo
echo "Next steps:"
echo "  1. Replace the placeholders (YOUR_SERVER, YOUR_PASSWORD, YOUR_PROXY_NAME)."
echo "  2. Validate it:"
echo "     ./validate.sh \"$DEST\""