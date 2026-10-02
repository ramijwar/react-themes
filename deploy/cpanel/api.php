<?php
/* ============================================================
   متحكم أمامي لواجهة الـ API على Apache / cPanel
   يوضع بجانب index.html في مجلد النشر (مثلاً public_html/themes/)
   كل طلبات /api/* تصل إلى هنا عبر إعادة الكتابة في .htaccess
   ============================================================ */

require __DIR__ . '/server/bootstrap.php';

api_bootstrap($_SERVER['REQUEST_URI'] ?? '/');
