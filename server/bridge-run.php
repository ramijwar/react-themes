<?php
/* ============================================================
   جسر التشغيل داخل بيئة المعاينة (PHP-WASM)
   يقرأ الطلب من /ex/.req.json ويكتب الرد إلى /ex/.res.json
   — نفس كود api.php دون أي تغيير —
   ============================================================ */

require_once __DIR__ . '/api.php';

$raw = @file_get_contents('/ex/.req.json');
$req = $raw ? json_decode($raw, true) : null;
if (!is_array($req)) {
    file_put_contents('/ex/.res.json', json_encode([
        'status' => 500, 'headers' => ['Content-Type' => 'application/json'],
        'body' => base64_encode(json_encode(['error' => 'bad bridge request'])),
    ]));
    return;
}

$res = handle_api(
    $req['method'] ?? 'GET',
    preg_replace('#^/api#', '', $req['uri'] ?? '/') ?: '/',
    $req['query'] ?? [],
    $req['headers'] ?? [],
    $req['body'] ?? ''
);

file_put_contents('/ex/.res.json', json_encode([
    'status' => $res['status'],
    'headers' => $res['headers'],
    'body' => base64_encode($res['body']),
]));
