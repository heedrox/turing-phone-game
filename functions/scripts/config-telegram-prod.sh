#!/bin/sh

script_path="$0"
script_directory="$(basename "$(dirname "$script_path")")"
. "$script_directory/../.env"
curl -F "url=https://us-central1-turing-phone-game.cloudfunctions.net/telegramBot" "https://api.telegram.org/bot$TELEGRAM_TOKEN/setWebhook"
