#!/bin/sh

script_path="$0"
script_directory="$(basename "$(dirname "$script_path")")"
. "$script_directory/../.env"
ngrok_pid=$(pgrep ngrok)
echo "Ngrok pid: $ngrok_pid"
if [ -z "$ngrok_pid" ]; then
  echo "No se encontro ngrok. Levantando... "
  ngrok http 5501 > /dev/null &
  sleep 1
fi
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url')
echo "La URL de ngrok es: $NGROK_URL"
curl -F "url=$NGROK_URL/turing-phone-game/us-central1/telegramBot" "https://api.telegram.org/bot$TELEGRAM_TOKEN/setWebhook"
