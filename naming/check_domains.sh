#!/usr/bin/env bash
# Checks .com / .app / .com.br availability via public RDAP endpoints
# (Verisign, Google Registry, Registro.br) — no browser or API key needed.
# 404 = not registered (available), 200 = registered (taken).
#
# Usage: ./check_domains.sh [names.csv] [results.csv]
set -euo pipefail

INPUT="${1:-names.csv}"
OUTPUT="${2:-results.csv}"
TLDS=(com app com.br)
MAX_RETRIES=4
RETRY_SLEEP=2
REQUEST_SLEEP=1

rdap_url() {
  local name="$1" tld="$2"
  if [ "$tld" = "com.br" ]; then
    echo "https://rdap.registro.br/domain/${name}.com.br"
  else
    echo "https://rdap.org/domain/${name}.${tld}"
  fi
}

check_domain() {
  local name="$1" tld="$2" url code attempt=1
  url=$(rdap_url "$name" "$tld")
  while [ "$attempt" -le "$MAX_RETRIES" ]; do
    code=$(curl -s -o /dev/null -L -w "%{http_code}" --max-time 15 "$url")
    case "$code" in
      404) echo "available"; return ;;
      200) echo "taken"; return ;;
    esac
    sleep "$RETRY_SLEEP"
    attempt=$((attempt + 1))
  done
  echo "unknown"
}

mapfile -t rows < <(tail -n +2 "$INPUT")
total_names=${#rows[@]}
done_names=0
start=$SECONDS

echo "name,concept,com,app,com_br" > "$OUTPUT"

for row in "${rows[@]}"; do
  name="${row%%,*}"
  concept="${row#*,}"
  concept="${concept%\"}"
  concept="${concept#\"}"

  printf "\r\033[K[%d/%d] checking %s (com, app, com.br)..." "$((done_names + 1))" "$total_names" "$name"

  results=()
  for tld in "${TLDS[@]}"; do
    results+=("$(check_domain "$name" "$tld")")
    sleep "$REQUEST_SLEEP"
  done

  done_names=$((done_names + 1))
  pct=$(( done_names * 100 / total_names ))
  elapsed=$((SECONDS - start))
  printf "\r\033[K[%3d%%] %d/%d | %ds | %-15s com:%-10s app:%-10s com.br:%-10s\n" \
    "$pct" "$done_names" "$total_names" "$elapsed" "$name" "${results[0]}" "${results[1]}" "${results[2]}"

  echo "${name},\"${concept}\",${results[0]},${results[1]},${results[2]}" >> "$OUTPUT"
done

printf "\nDone in %ds. Results -> %s\n" "$((SECONDS - start))" "$OUTPUT"
