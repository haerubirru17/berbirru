#!/usr/bin/env bash
# Task 7 — Real-D1 concurrency/fault harness (plan §462-472).
# Dipanggil dari root repo:  bash tests/account-status-real-d1.sh [storeDir]
# DEVIASI TERDOKUMENTASI dari snippet plan: `wrangler d1 migrations apply` DILARANG di
# proyek ini (d1_migrations drift + migrasi numbered tidak membangun base social schema),
# maka toko dibangun lewat jalur teruji: fixture pre-0034 + file 0034.
set -euo pipefail
STORE="${1:-.wrangler/state/account-status-test}"
PORT="${HARNESS_PORT:-8802}"
CFG=wrangler.uji.toml
BASE="http://127.0.0.1:${PORT}"
LOG="$(mktemp)"
DEV_PID=""

cleanup() { { [[ -n "$DEV_PID" ]] && kill "$DEV_PID" 2>/dev/null; } || true; sleep 1; rm -rf "$STORE" "$LOG"; }
trap cleanup EXIT

rm -rf "$STORE"
d1x()  { npx wrangler d1 execute DB --config "$CFG" --local --persist-to "$STORE" "$@" >/dev/null; }
d1q()  { npx wrangler d1 execute DB --config "$CFG" --local --persist-to "$STORE" --json --command "$1"; }
jq1()  { python3 -c "import json,sys; print(list(json.load(sys.stdin)[0]['results'][0].values())[0])"; }
fail() { echo "HARNESS-FAIL: $1" >&2; exit 1; }
pass() { echo "HARNESS-PASS: $1"; }

d1x --file tests/fixtures/current-schema-pre-0034.sql
d1x --file migrations/0034_social_account_status.sql

# --- seed dinamis: id/password/token via lib asli (tanpa mock hash) ---
PWHASH="$(node --experimental-strip-types -e "import('./src/lib/password.ts').then(async m=>process.stdout.write(await m.hashPassword('HarnessPass123!')))")"
VIC="$(node -e "console.log(crypto.randomUUID())")"
OTTOK="own-$(node -e "console.log(crypto.randomBytes(16).toString('hex'))")"
OHH="$(node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]).digest('hex'))" "$OTTOK")"
VSTOK="vic-$(node -e "console.log(crypto.randomBytes(16).toString('hex'))")"
VHH="$(node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]).digest('hex'))" "$VSTOK")"
Q() { printf "'%s'" "${1//\'/\'\'}"; }
d1x --command "INSERT INTO users (id,email,password_hash,pen_name,account_status) VALUES ($(Q "$VIC"),$(Q "harness@x.invalid"),$(Q "$PWHASH"),$(Q "vicpen"),'active');"
d1x --command "INSERT INTO users (id,email,password_hash,pen_name,account_status) VALUES ('$(node -e "console.log(crypto.randomUUID())")',$(Q "haeru@berbirru.com"),$(Q "$PWHASH"),$(Q "ownerpen"),'active');"
OWNER_ID="$(d1q "SELECT id FROM users WHERE lower(email)=lower('haeru@berbirru.com')" | jq1)"
d1x --command "INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES ('h-so',$(Q "$OWNER_ID"),$(Q "$OHH"),datetime('now','+25 minutes')),('h-sv',$(Q "$VIC"),$(Q "$VHH"),datetime('now','+25 minutes'));"
OCO="berbirru_session=$OTTOK"
VCO="berbirru_session=$VSTOK"

npx wrangler dev --config "$CFG" --local --persist-to "$STORE" --port "$PORT" >"$LOG" 2>&1 &
DEV_PID=$!
for i in $(seq 1 40); do
  [[ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/auth/me" 2>/dev/null)" == "200" ]] && break
  sleep 2
done
[[ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/auth/me" 2>/dev/null)" == "200" ]] || { cat "$LOG" | tail -20; fail "server tidak siap"; }

# ============ A. 10-way suspend race: tepat satu pemenang ============
RES="$(node tests/account-status-real-d1.mjs "$BASE" suspend "$VIC" 10 "$OCO")"
echo "A-res: $RES"
[[ "$(python3 -c "import json,sys; print(sum(1 for r in json.loads(sys.argv[1]) if r['status']==200))" "$RES")" == "1" ]] || fail "A: pemenang != 1"
AUD="$(d1q "SELECT COUNT(*) c FROM social_account_actions WHERE action='user_suspend' AND target_user_id=$(Q "$VIC")" | jq1)"
[[ "$AUD" == "1" ]] || fail "A: audit != 1"
SES="$(d1q "SELECT COUNT(*) c FROM sessions WHERE user_id=$(Q "$VIC")" | jq1)"
[[ "$SES" == "0" ]] || fail "A: sesi victim != 0"
ST="$(d1q "SELECT account_status c FROM users WHERE id=$(Q "$VIC")" | jq1)"
[[ "$ST" == "suspended" ]] || fail "A: status bukan suspended"
pass "A: 10-way suspend → 1 pemenang, audit 1, semua sesi victic musnah"

# ============ B. suspend sudah terjadi → login semua ditolak/tak berefek ============
RES="$(node tests/account-status-real-d1.mjs "$BASE" login "$VIC" 6 none "{\"email\":\"harness@x.invalid\",\"password\":\"HarnessPass123!\",\"turnstile_token\":\"XXXX.DUMMY.TOKEN.XXXX\"}")"
echo "B-res: $RES"
COOKS="$(python3 -c "import json,sys; print(sum(1 for r in json.loads(sys.argv[1]) if r['status']==200 and 'berbirru_session=' in r['setCookie']))" "$RES")"
[[ "$COOKS" == "0" ]] || fail "B: ada sesi baru utk akun suspended"
SES="$(d1q "SELECT COUNT(*) c FROM sessions WHERE user_id=$(Q "$VIC")" | jq1)"
[[ "$SES" == "0" ]] || fail "B: baris sesi muncul utk suspended"
pass "B: 6 login concurrent setelah suspend → 0 sesi, 0 cookie"

# ============ C. reinstate → login hidup lagi; 5-way reinstate race ============
RES="$(node tests/account-status-real-d1.mjs "$BASE" reinstate "$VIC" 5 "$OCO")"
echo "C-res: $RES"
[[ "$(python3 -c "import json,sys; print(sum(1 for r in json.loads(sys.argv[1]) if r['status']==200))" "$RES")" == "1" ]] || fail "C: pemenang reinstate != 1"
RES="$(node tests/account-status-real-d1.mjs "$BASE" login "$VIC" 3 none "{\"email\":\"harness@x.invalid\",\"password\":\"HarnessPass123!\",\"turnstile_token\":\"XXXX.DUMMY.TOKEN.XXXX\"}")"
OKS="$(python3 -c "import json,sys; print(sum(1 for r in json.loads(sys.argv[1]) if r['status']==200))" "$RES")"
[[ "$OKS" == "3" ]] || fail "C: login pasca-reinstate gagal"
SES="$(d1q "SELECT COUNT(*) c FROM sessions WHERE user_id=$(Q "$VIC")" | jq1)"
[[ "$SES" == "3" ]] || fail "C: sesi pasca-reinstate != 3"
pass "C: reinstate 1 pemenang → 3 login baru valid (sesi lama tetap tak dihidupkan — sudah dibuktikan T6/T5)"

# ============ D. FAULT: audit-path rusak → batch rollback penuh di D1 nyata ============
d1x --command "DROP TABLE social_account_actions"   # injeksi fault sambil server hidup
VICTIM2="$(node -e "console.log(crypto.randomUUID())")"
d1x --command "INSERT INTO users (id,email,password_hash,pen_name,account_status) VALUES ($(Q "$VICTIM2"),$(Q "harness2@x.invalid"),$(Q "$PWHASH"),$(Q "vicpen2"),'active');"
d1x --command "INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES ('h-sv2',$(Q "$VICTIM2"),$(Q "$VHH"),datetime('now','+25 minutes'));"
HTTP="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/admin/users/$VICTIM2/suspend" -H "Content-Type: application/json" -H "Cookie: $OCO" -H "Origin: $BASE" -d '{"reason":"fault injection harness race panjang"}')"
[[ "$HTTP" == "500" ]] || fail "D: suspend dgn audit rusak != 500 (dapat $HTTP)"
ST="$(d1q "SELECT account_status c FROM users WHERE id=$(Q "$VICTIM2")" | jq1)"
[[ "$ST" == "active" ]] || fail "D: user berubah tanpa audit (batch bocor)"
SES="$(d1q "SELECT COUNT(*) c FROM sessions WHERE user_id=$(Q "$VICTIM2")" | jq1)"
[[ "$SES" == "1" ]] || fail "D: sesi korban terhapus (rollback tidak penuh)"
pass "D: audit-path failure → 500 + user tetap active + sesi utuh (D1 batch rollback nyata)"

# ============ E. race kasus plan §6.4: finalizer-first vs suspend-first ============
d1x --command "CREATE TABLE social_account_actions (id TEXT PRIMARY KEY, action TEXT NOT NULL CHECK (action IN ('user_suspend','user_reinstate')), target_user_id TEXT NOT NULL, actor_user_id TEXT NOT NULL, actor_email TEXT NOT NULL, reason TEXT NOT NULL CHECK (length(reason) BETWEEN 10 AND 500), created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (target_user_id) REFERENCES users(id), FOREIGN KEY (actor_user_id) REFERENCES users(id)); \
CREATE INDEX IF NOT EXISTS idx_social_account_actions_target_created ON social_account_actions(target_user_id, created_at DESC);"
VICTIM3="$(node -e "console.log(crypto.randomUUID())")"
d1x --command "INSERT INTO users (id,email,password_hash,pen_name,account_status) VALUES ($(Q "$VICTIM3"),$(Q "harness3@x.invalid"),$(Q "$PWHASH"),$(Q "vicpen3"),'active');"
# suspend dan 8 login ditembak nyaris bersamaan (barrier thread sh di node driver tidak ada;
# dua tembakan async ini overlapping di jalur D1 nyata):
node tests/account-status-real-d1.mjs "$BASE" login "$VICTIM3" 8 none "{\"email\":\"harness3@x.invalid\",\"password\":\"HarnessPass123!\",\"turnstile_token\":\"XXXX.DUMMY.TOKEN.XXXX\"}" > /tmp/h-login.json &
BGPID=$!
sleep 0.05
RES="$(node tests/account-status-real-d1.mjs "$BASE" suspend "$VICTIM3" 1 "$OCO")"
wait $BGPID
ST="$(d1q "SELECT account_status c FROM users WHERE id=$(Q "$VICTIM3")" | jq1)"
SES="$(d1q "SELECT COUNT(*) c FROM sessions WHERE user_id=$(Q "$VICTIM3")" | jq1)"
[[ "$ST" == "suspended" ]] || fail "E: status akhir bukan suspended"
[[ "$SES" == "0" ]] || fail "E: ada sesi tersisa (guard delete seharusnya memakan yang mana pun yang menang duluan)"
LOGINOKS="$(python3 -c "import json,sys; print(sum(1 for r in json.loads(sys.argv[1]) if r['status']==200))" "$(cat /tmp/h-login.json)")"
echo "E: login-yang-pernah-berhasil=$LOGINOKS (boleh >0 — finalizer-first; semua tetap terhapus suspend)"
AUD="$(d1q "SELECT COUNT(*) c FROM social_account_actions WHERE action='user_suspend' AND target_user_id=$(Q "$VICTIM3")" | jq1)"
[[ "$AUD" == "1" ]] || fail "E: audit != 1"
pass "E: login-vs-suspend overlap → status konsisten suspended, 0 sesi tersisa, audit 1"

rm -f /tmp/h-login.json
pass "SEMUA real-D1 race/fault harness lulus"
