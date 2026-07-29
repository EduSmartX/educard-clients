#!/bin/bash
cd "$(dirname "$0")"
exec npx expo start "$@"
