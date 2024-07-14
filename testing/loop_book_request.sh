#!/bin/bash

URL="http://s2.gnip.vip:37895/booking/book"

ACCEPT_HEADER="accept: application/json"
AUTH_HEADER="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxOTUzNDU3NiwianRpIjoiMTBkYjMyNTUtODAzMi00NDkwLTk2Y2YtYTAwZWI3NzA5M2JjIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ6aWQiOiJ6NTQwNTMyNSJ9LCJuYmYiOjE3MTk1MzQ1NzYsImNzcmYiOiJkZDcxN2I2Mi1hMzE4LTQ0NWItOTc4NS0xMDczYjUxYjIwYzQiLCJleHAiOjc3MTk1MzQ1MTZ9.lH9TOUBK4Nri5_V3rJHJZz2EF4kxqqpmRevntfwMM4U"
CONTENT_TYPE_HEADER="Content-Type: application/json"

NUM_REQUESTS=100

for ((i=1; i<=NUM_REQUESTS; i++))
do
  ROOM_ID=$i

  DATA=$(cat <<EOF
{
  "room_id": $ROOM_ID,
  "date": "2024-07-14",
  "start_time": "00:00",
  "end_time": "00:30"
}
EOF
  )

  curl -X 'POST' "$URL" \
    -H "$ACCEPT_HEADER" \
    -H "$AUTH_HEADER" \
    -H "$CONTENT_TYPE_HEADER" \
    -d "$DATA"

  echo "Sent request with room_id=$ROOM_ID"

done
