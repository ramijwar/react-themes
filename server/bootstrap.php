<?php
/* ============================================================
   جسر بين متغيرات PHP الفائقة وواجهة API الموحدة
   ============================================================ */

require_once __DIR__ . '/api.php';

function collect_headers(): array
{
    $headers = [];
    foreach ($_SERVER as $k => $v) {
        if (strpos($k, 'HTTP_') === 0) {
            $name = strtolower(str_replace('_', '-', substr($k, 5)));
            $headers[$name] = $v;
        }
    }
    if (isset($_SERVER['CONTENT_TYPE'])) $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
    return $headers;
}

function emit(array $res): void
{
    http_response_code($res['status']);
    foreach ($res['headers'] as $k => $v) header("$k: $v");
    echo $res['body'];
}

function api_bootstrap(string $uri): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    /* CORS — للسماح بتشغيل الواجهة من منفذ مختلف أثناء التطوير */
    header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Max-Age: 86400');
    if ($method === 'OPTIONS') {
        http_response_code(204);
        return;
    }

    /* استخراج مسار الـ API مهما كان موقع التثبيت (جذر أو مجلد فرعي مثل /themes/) */
    $full = parse_url($uri, PHP_URL_PATH) ?: '/';
    if (preg_match('#^(.*?)/api(/.*)?$#', $full, $m)) {
        $path = ($m[2] ?? '') === '' ? '/' : $m[2];
    } else {
        $path = $full;
    }
    $rawBody = file_get_contents('php://input') ?: '';
    $res = handle_api($method, $path, $_GET, collect_headers(), $rawBody);
    emit($res);
}
