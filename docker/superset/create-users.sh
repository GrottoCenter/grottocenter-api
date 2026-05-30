#!/bin/bash
# Create Superset users with GC_Creator role.
# Usage: ./create-users.sh <superset_url> <admin_username> <admin_password>
#
# Example:
#   ./create-users.sh https://bi.grottocenter.org admin mypassword
#
# To add users, append lines to the USERS array below:
#   "FirstName LastName"

set -e

SUPERSET_URL="${1:?Usage: $0 <superset_url> <admin_username> <admin_password>}"
ADMIN_USER="${2:?Usage: $0 <superset_url> <admin_username> <admin_password>}"
ADMIN_PASS="${3:?Usage: $0 <superset_url> <admin_username> <admin_password>}"
ROLE_NAME="${4:-GC_Creator}"
EMAIL_DOMAIN="grottocenter.org"

# --- Users to create (add more lines as needed) ---
USERS=(
  # "Clément Ronzon"
  # "Frédéric Urien"
  # "Paul Aubertin"
  # "Chloé Dubray"
  # "Daniel Reyes"
  # "Christophe Bes"
  "Zouhair Moudni"
)

# --- Helper: lowercase and strip accents ---
normalize() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 'y/àáâãäåèéêëìíîïòóôõöùúûüýñç/aaaaaaeeeeiiiiooooouuuuync/' | tr ' ' '.'
}

# --- Get access token ---
echo "==> Authenticating as $ADMIN_USER..."
TOKEN=$(curl -sf -X POST "$SUPERSET_URL/api/v1/security/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\",\"provider\":\"db\"}" \
  | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "ERROR: Failed to authenticate" >&2
  exit 1
fi

# --- Get role ID ---
echo "==> Looking up role: $ROLE_NAME..."
ROLE_ID=$(curl -sf "$SUPERSET_URL/api/v1/security/roles/" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r ".result[] | select(.name==\"$ROLE_NAME\") | .id")

if [ -z "$ROLE_ID" ] || [ "$ROLE_ID" = "null" ]; then
  echo "ERROR: Role '$ROLE_NAME' not found" >&2
  exit 1
fi
echo "    Role ID: $ROLE_ID"

# --- Create users ---
echo ""
echo "==> Creating users..."
echo "-------------------------------------------"
printf "%-20s %-35s %s\n" "USERNAME" "EMAIL" "PASSWORD"
echo "-------------------------------------------"

for entry in "${USERS[@]}"; do
  FIRST_NAME=$(echo "$entry" | cut -d' ' -f1)
  LAST_NAME=$(echo "$entry" | cut -d' ' -f2-)

  USERNAME=$(normalize "$FIRST_NAME").$(normalize "$LAST_NAME")
  EMAIL="$(normalize "$FIRST_NAME").$(normalize "$LAST_NAME")@$EMAIL_DOMAIN"
  PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | head -c 16)

  RESPONSE=$(curl -sf -X POST "$SUPERSET_URL/api/v1/security/users/" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"first_name\": \"$FIRST_NAME\",
      \"last_name\": \"$LAST_NAME\",
      \"username\": \"$USERNAME\",
      \"email\": \"$EMAIL\",
      \"password\": \"$PASSWORD\",
      \"roles\": [$ROLE_ID],
      \"active\": true
    }" 2>&1) || true

  if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    printf "%-20s %-35s %s\n" "$USERNAME" "$EMAIL" "$PASSWORD"
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.message // "Unknown error"' 2>/dev/null || echo "$RESPONSE")
    printf "%-20s %-35s FAILED: %s\n" "$USERNAME" "$EMAIL" "$ERROR"
  fi
done

echo "-------------------------------------------"
echo ""
echo "Done. Save the passwords above — they cannot be retrieved later."
