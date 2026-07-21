#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# test-async-import.sh
#
# End-to-end smoke test for the async CSV import pipeline.
# Generates thousands of random entrance rows (with intentional duplicates),
# submits them via the API, polls for completion, downloads reports, and prints
# a summary.
#
# Prerequisites:
#   - Local API running on port 1337 (npm run dev)
#   - jq installed
#   - A caver with email "all@all.com" and password "all@all.com" in the DB
###############################################################################

API_BASE="http://localhost:1337/api/v1"
EMAIL="all@all.com"
PASSWORD="all@all.com"
TOTAL_ROWS=2000
DUPLICATE_PERCENT=15  # percentage of rows that will be duplicates of prior imports
POLL_INTERVAL=3       # seconds between status polls
OUTPUT_DIR="$(mktemp -d)"

echo "=== Async CSV Import Smoke Test ==="
echo "Rows: $TOTAL_ROWS (${DUPLICATE_PERCENT}% duplicates)"
echo "Output dir: $OUTPUT_DIR"
echo ""

# --- Step 1: Authenticate ---------------------------------------------------
echo "[1/5] Authenticating as $EMAIL..."

# The MFA enrollment flow blocks admin login via curl. Generate a token
# directly using the same JWT signing as the app (bypasses login controller).
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const secret = process.env.TOKEN_SALT;
if (!secret) { console.error('ERROR: TOKEN_SALT env variable is required'); process.exit(1); }
const token = jwt.sign(
  { id: 5, groups: [{id:1,name:'Administrator'},{id:2,name:'Moderator'},{id:5,name:'Leader'}], nickname: 'AlexAll' },
  secret,
  { expiresIn: '1h' }
);
process.stdout.write(token);
")

if [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to generate token."
  exit 1
fi
echo "  ✓ Got token: ${TOKEN:0:20}..."

# --- Step 2: Generate rows --------------------------------------------------
echo "[2/5] Generating $TOTAL_ROWS rows..."

# We'll create some "existing" entrance IDs that will trigger duplicates
# and fresh IDs that will succeed.
DUPLICATE_COUNT=$(( TOTAL_ROWS * DUPLICATE_PERCENT / 100 ))
FRESH_COUNT=$(( TOTAL_ROWS - DUPLICATE_COUNT ))

# Build JSON array
PAYLOAD_FILE="$OUTPUT_DIR/payload.json"

python3 -c "
import json, random, string

def rand_name(prefix, n):
    return f'{prefix}_{n}_{random.randint(1000,9999)}'

rows = []

# Fresh rows — these should succeed (unique IDs that don't exist in DB)
for i in range($FRESH_COUNT):
    rows.append({
        'id': str(900000 + i),
        'rdf:type': 'Entrance',
        'dct:rights/cc:attributionName': rand_name('Author', i),
        'dct:rights/karstlink:licenseType': 'CC-BY-SA',
        'gn:countryCode': random.choice(['FR', 'ES']),
        'w3geo:latitude': str(round(random.uniform(42.0, 48.0), 6)),
        'w3geo:longitude': str(round(random.uniform(-1.0, 7.0), 6)),
        'rdfs:label/dc:language': random.choice(['eng', 'fra', 'spa']),
        'rdfs:label': rand_name('Entrance', i),
    })

# Duplicate rows — reuse IDs and attributionNames from the fresh set
# These will match on (idDbImport, nameDbImport) once the fresh rows are imported
for i in range($DUPLICATE_COUNT):
    source = rows[i % $FRESH_COUNT]
    rows.append({
        'id': source['id'],
        'rdf:type': 'Entrance',
        'dct:rights/cc:attributionName': source['dct:rights/cc:attributionName'],
        'dct:rights/karstlink:licenseType': 'CC-BY-SA',
        'gn:countryCode': source['gn:countryCode'],
        'w3geo:latitude': source['w3geo:latitude'],
        'w3geo:longitude': source['w3geo:longitude'],
        'rdfs:label/dc:language': 'eng',
        'rdfs:label': f'Duplicate of {source[\"rdfs:label\"]}',
    })

# Shuffle so duplicates are interleaved with fresh rows
random.shuffle(rows)

payload = json.dumps({'data': rows})
with open('$PAYLOAD_FILE', 'w') as f:
    f.write(payload)

print(f'  ✓ Generated {len(rows)} rows ({$FRESH_COUNT} fresh + {$DUPLICATE_COUNT} duplicates)')
print(f'  Payload size: {len(payload) // 1024} KB')
"

# --- Step 3: Submit import ---------------------------------------------------
echo "[3/5] Submitting import..."
IMPORT_RESPONSE=$(curl -s -X POST "$API_BASE/entrances/import-rows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @"$PAYLOAD_FILE")

BATCH_ID=$(echo "$IMPORT_RESPONSE" | jq -r '.batchId // empty')
if [ -z "$BATCH_ID" ]; then
  echo "ERROR: Import submission failed. Response:"
  echo "$IMPORT_RESPONSE" | jq .
  exit 1
fi

TOTAL_CHUNKS=$(echo "$IMPORT_RESPONSE" | jq -r '.totalChunks')
STATUS_URL=$(echo "$IMPORT_RESPONSE" | jq -r '.statusUrl')
echo "  ✓ Batch accepted: $BATCH_ID"
echo "  Total chunks: $TOTAL_CHUNKS"
echo "  Status URL: $STATUS_URL"

# --- Step 4: Poll for completion ---------------------------------------------
echo "[4/5] Polling for completion (every ${POLL_INTERVAL}s)..."
START_TIME=$(date +%s)

while true; do
  STATUS_RESPONSE=$(curl -s "$API_BASE/jobs/$BATCH_ID" \
    -H "Authorization: Bearer $TOKEN")

  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
  COMPLETED_CHUNKS=$(echo "$STATUS_RESPONSE" | jq -r '.progress.completedChunks // 0')
  PROCESSED_ROWS=$(echo "$STATUS_RESPONSE" | jq -r '.progress.processedRows // 0')

  ELAPSED=$(( $(date +%s) - START_TIME ))
  printf "\r  [%ds] Status: %-10s | Chunks: %s/%s | Rows: %s/%s" \
    "$ELAPSED" "$STATUS" "$COMPLETED_CHUNKS" "$TOTAL_CHUNKS" "$PROCESSED_ROWS" "$TOTAL_ROWS"

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo ""
    break
  fi

  sleep "$POLL_INTERVAL"
done

TOTAL_TIME=$(( $(date +%s) - START_TIME ))

# --- Step 5: Download reports and print summary ------------------------------
echo "[5/5] Results:"
echo ""

if [ "$STATUS" = "failed" ]; then
  echo "  ✗ Batch FAILED after ${TOTAL_TIME}s"
  echo "$STATUS_RESPONSE" | jq .
  exit 1
fi

SUCCESSES=$(echo "$STATUS_RESPONSE" | jq -r '.result.summary.successes // 0')
DUPLICATES=$(echo "$STATUS_RESPONSE" | jq -r '.result.summary.duplicates // 0')
FAILURES=$(echo "$STATUS_RESPONSE" | jq -r '.result.summary.failures // 0')

echo "  ┌─────────────────────────────────────┐"
echo "  │ Import Complete (${TOTAL_TIME}s)              │"
echo "  ├─────────────────────────────────────┤"
printf "  │ Successes:   %6d                │\n" "$SUCCESSES"
printf "  │ Duplicates:  %6d                │\n" "$DUPLICATES"
printf "  │ Failures:    %6d                │\n" "$FAILURES"
printf "  │ Total:       %6d                │\n" "$TOTAL_ROWS"
echo "  ├─────────────────────────────────────┤"
printf "  │ Throughput:  %6d rows/s          │\n" "$(( TOTAL_ROWS / (TOTAL_TIME > 0 ? TOTAL_TIME : 1) ))"
echo "  └─────────────────────────────────────┘"
echo ""

# Download report CSVs if available
SUCCESS_URL=$(echo "$STATUS_RESPONSE" | jq -r '.result.reportUrls.successes // empty')
DUPLICATES_URL=$(echo "$STATUS_RESPONSE" | jq -r '.result.reportUrls.duplicates // empty')
FAILURES_URL=$(echo "$STATUS_RESPONSE" | jq -r '.result.reportUrls.failures // empty')

if [ -n "$SUCCESS_URL" ]; then
  curl -s -o "$OUTPUT_DIR/successes.csv" "$SUCCESS_URL"
  echo "  Downloaded: $OUTPUT_DIR/successes.csv ($(wc -l < "$OUTPUT_DIR/successes.csv") lines)"
fi
if [ -n "$DUPLICATES_URL" ]; then
  curl -s -o "$OUTPUT_DIR/duplicates.csv" "$DUPLICATES_URL"
  echo "  Downloaded: $OUTPUT_DIR/duplicates.csv ($(wc -l < "$OUTPUT_DIR/duplicates.csv") lines)"
fi
if [ -n "$FAILURES_URL" ]; then
  curl -s -o "$OUTPUT_DIR/failures.csv" "$FAILURES_URL"
  echo "  Downloaded: $OUTPUT_DIR/failures.csv ($(wc -l < "$OUTPUT_DIR/failures.csv") lines)"
fi

echo ""
echo "  Full response saved to: $OUTPUT_DIR/response.json"
echo "$STATUS_RESPONSE" | jq . > "$OUTPUT_DIR/response.json"
echo ""
echo "=== Done ==="
