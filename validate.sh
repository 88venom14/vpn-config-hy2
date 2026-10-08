#!/usr/bin/env bash
set -euo pipefail

CONFIG="${1:-./config-hy2.yaml}"

if [ ! -f "$CONFIG" ]; then
    echo "ERROR: file not found:"
    echo "  $CONFIG"
    exit 1
fi

echo "Validating:"
echo "  $CONFIG"
echo

# --------------------------------------------------
# Placeholder detection
# --------------------------------------------------

if grep -q 'YOUR_SERVER\|YOUR_PASSWORD\|YOUR_PROXY_NAME\|YOUR_SNI' "$CONFIG"; then
    echo "ERROR: placeholders are still present:"
    grep -n 'YOUR_SERVER\|YOUR_PASSWORD\|YOUR_PROXY_NAME\|YOUR_SNI' "$CONFIG"
    echo
    echo "Replace them before using the configuration."
    exit 1
fi

# --------------------------------------------------
# Mihomo native validation
# --------------------------------------------------

MIHOMO=""

for candidate in mihomo mihomo-linux-amd64 mihomo-linux-arm64; do
    if command -v "$candidate" >/dev/null 2>&1; then
        MIHOMO="$candidate"
        break
    fi
done

if [ -n "$MIHOMO" ]; then
    "$MIHOMO" -t -f "$CONFIG"

    echo
    echo "OK: Mihomo accepted the configuration."
    exit 0
fi

# --------------------------------------------------
# Python + PyYAML fallback
# --------------------------------------------------

if command -v python3 >/dev/null 2>&1; then

    if python3 -c "import yaml" >/dev/null 2>&1; then

        python3 - "$CONFIG" <<'PY'
from pathlib import Path
import sys
import yaml

path = Path(sys.argv[1])

with path.open("r", encoding="utf-8") as f:
    data = yaml.safe_load(f)

if not isinstance(data, dict):
    raise SystemExit(
        "ERROR: top-level YAML value must be a mapping."
    )

required = [
    "proxies",
    "proxy-groups",
    "rule-providers",
    "rules",
]

missing = [key for key in required if key not in data]

if missing:
    raise SystemExit(
        "ERROR: missing keys: " + ", ".join(missing)
    )

for key in ("proxies", "proxy-groups", "rules"):
    if not data[key]:
        raise SystemExit(f"ERROR: {key} is empty.")

group_names = {g.get("name") for g in data["proxy-groups"] if isinstance(g, dict)}
proxy_names = {p.get("name") for p in data["proxies"] if isinstance(p, dict)}

if not group_names:
    raise SystemExit("ERROR: proxy-groups has no usable groups.")

known_targets = group_names | {"DIRECT", "REJECT", "PASS", "COMPATIBLE", "GLOBAL"}

unknown = []

for rule in data["rules"]:
    if not isinstance(rule, str):
        raise SystemExit(f"ERROR: rule must be a string: {rule!r}")

    parts = [p.strip() for p in rule.split(",")]
    if len(parts) < 2:
        raise SystemExit(f"ERROR: malformed rule: {rule}")

    if parts[0] in {"MATCH", "FINAL"}:
        continue

    target = parts[2] if len(parts) > 2 else None
    if target is not None and target not in known_targets:
        unknown.append((rule, target))

if unknown:
    details = "\n".join(f"  {rule} -> {target}" for rule, target in unknown)
    raise SystemExit("ERROR: rules reference unknown proxy groups:\n" + details)

rule_providers = data.get("rule-providers") or {}
missing_providers = {
    r.split(",")[1].strip()
    for r in data["rules"]
    if r.startswith("RULE-SET,")
} - set(rule_providers)

if missing_providers:
    raise SystemExit(
        "ERROR: rules reference undefined rule-providers: "
        + ", ".join(sorted(missing_providers))
    )

print("OK: YAML syntax, rule targets and rule-provider references are valid.")
PY

        exit 0
    fi
fi

echo "ERROR: no configuration validator available."
echo
echo "Install Mihomo or PyYAML."
echo
echo "Debian/Ubuntu:"
echo "  sudo apt install python3-yaml"
echo
exit 2