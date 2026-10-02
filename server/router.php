<?php
/* ============================================================
   موجّه خادم PHP المدمج
   التشغيل:  php -S 0.0.0.0:8080 server/router.php
   يقدّم: واجهة API + ملفات dist/ + تراجع SPA
   ============================================================ */

require_once __DIR__ . '/bootstrap.php';

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

/* ---- واجهة API ---- */
if ($uri === '/api' || strpos($uri, '/api/') === 0) {
    api_bootstrap($uri);
    return;
}

/* ---- ملفات ثابتة من dist ---- */
$dist = realpath(__DIR__ . '/../dist') ?: (__DIR__ . '/../dist');
$path = $dist . $uri;
if ($uri !== '/' && is_file($path) && strpos(realpath($path), $dist) === 0) {
    $mimes = [
        'html' => 'text/html; charset=utf-8', 'js' => 'text/javascript; charset=utf-8', 'mjs' => 'text/javascript',
        'css' => 'text/css; charset=utf-8', 'json' => 'application/json; charset=utf-8', 'svg' => 'image/svg+xml',
        'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', 'webp' => 'image/webp',
        'ico' => 'image/x-icon', 'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf', 'map' => 'application/json',
        'txt' => 'text/plain; charset=utf-8',
    ];
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($path));
    if ($ext !== 'html') header('Cache-Control: public, max-age=86400');
    readfile($path);
    return;
}

/* ---- تراجع SPA ---- */
$index = $dist . '/index.html';
if (is_file($index)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($index);
    return;
}

http_response_code(503);
header('Content-Type: text/plain; charset=utf-8');
echo "لم يتم بناء الواجهة بعد — نفّذ: npm install && npm run build\n";
