#!/usr/bin/env bash
# ============================================================
# تشغيل ستوديو القوالب — خادم PHP مدمج (API + الواجهة)
# المتطلبات: PHP 8.1+ مع pdo_sqlite (مضمّنة غالباً)
# ============================================================
set -e
cd "$(dirname "$0")/.."

PORT="${1:-8080}"

if [ ! -d dist ]; then
  echo "→ مجلد dist غير موجود — جارٍ بناء الواجهة…"
  npm install && npm run build
fi

mkdir -p server/data
echo "✔ الخادم يعمل على: http://localhost:$PORT"
echo "  المدير: admin / admin123   —   عضو تجريبي: demo / demo123"
php -S "0.0.0.0:$PORT" server/router.php
