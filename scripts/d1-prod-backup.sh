#!/usr/bin/env bash
# Backup D1 prod per-tabel (FTS5 virtual table dilewati — wrangler export tak mendukung).
set -euo pipefail
cd /tmp/main-merge
set -a; source ~/.config/cloudflare/cloudflare.env; set +a
OUT=~/.hermes/cache/scratch/d1-prod-backups
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p "$OUT"
SQL=$(npx wrangler d1 execute berbirru-db --remote --json --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '%_fts%' AND name NOT LIKE '%_config' AND name NOT LIKE '%_data' AND name NOT LIKE '%_idx' AND name NOT LIKE '%_docsize'")
echo "$SQL" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('\n'.join(r['name'] for r in d[0]['results']))" > "$OUT/tables-$TS.txt"
BUNDLE="$OUT/d1-prod-pre-strix-$TS"
mkdir -p "$BUNDLE"
cp "$OUT/tables-$TS.txt" "$BUNDLE/tables.txt"
npx wrangler d1 execute berbirru-db --remote --json --command "SELECT sql FROM sqlite_master WHERE sql IS NOT NULL" | python3 -c "
import sys, json
d = json.load(sys.stdin)
open('$BUNDLE/schema.sql','w').write(';\n'.join(r['sql'] for r in d[0]['results']) + ';\n')"
while read -r t; do
  npx wrangler d1 execute berbirru-db --remote --json --command "SELECT * FROM \"$t\"" > "$BUNDLE/table-$t.json" 2>/dev/null || echo "(gagal: $t)" >> "$BUNDLE/errors.txt"
done < "$BUNDLE/tables.txt"
tar czf "$BUNDLE.tar.gz" -C "$OUT" "d1-prod-pre-strix-$TS"
sha256sum "$BUNDLE.tar.gz" | tee "$BUNDLE.tar.gz.sha256"
rm -rf "$BUNDLE" "$OUT/tables-$TS.txt"
echo "BACKUP SELESAI"
