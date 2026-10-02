<?php
/* ============================================================
   واجهة برمجة التطبيقات REST — نظام العضوية + القوالب + الثيمات
   تعمل مع أي PHP 8+ (خادم مدمج / Apache / nginx + php-fpm)
   ============================================================ */

require_once __DIR__ . '/db.php';

/**
 * نقطة الدخول الموحدة.
 * @return array{status:int, headers:array<string,string>, body:string}
 */
function handle_api(string $method, string $path, array $query, array $headers, string $rawBody): array
{
    $json = json_decode($rawBody ?: 'null', true);
    if (!is_array($json)) $json = [];

    try {
        return route($method, $path, $query, $headers, $json);
    } catch (ApiError $e) {
        return j($e->status, ['error' => $e->getMessage()]);
    } catch (Throwable $e) {
        return j(500, ['error' => 'خطأ في الخادم: ' . $e->getMessage()]);
    }
}

class ApiError extends Exception
{
    public int $status;
    public function __construct(string $msg, int $status = 400)
    {
        parent::__construct($msg);
        $this->status = $status;
    }
}

function j(int $status, $data): array
{
    return [
        'status' => $status,
        'headers' => ['Content-Type' => 'application/json; charset=utf-8'],
        'body' => json_encode($data, JSON_UNESCAPED_UNICODE),
    ];
}

/* ---------------- المصادقة ---------------- */

function bearer_token(array $headers): ?string
{
    $auth = $headers['authorization'] ?? $headers['Authorization'] ?? '';
    if (preg_match('/^Bearer\s+(\S+)$/i', trim($auth), $m)) return $m[1];
    return null;
}

function current_user(array $headers): ?array
{
    $token = bearer_token($headers);
    if (!$token) return null;
    $st = db()->prepare(
        "SELECT u.* FROM tokens t JOIN users u ON u.id = t.user_id
         WHERE t.token = ? AND t.expires_at > datetime('now')"
    );
    $st->execute([$token]);
    $u = $st->fetch();
    return $u ?: null;
}

function require_user(array $headers): array
{
    $u = current_user($headers);
    if (!$u) throw new ApiError('يجب تسجيل الدخول', 401);
    if ($u['status'] === 'banned') throw new ApiError('هذا الحساب محظور — راجع الإدارة', 403);
    return $u;
}

function require_admin(array $headers): array
{
    $u = require_user($headers);
    if ($u['role'] !== 'admin') throw new ApiError('صلاحيات المدير مطلوبة', 403);
    return $u;
}

function issue_token(int $userId): string
{
    $token = bin2hex(random_bytes(32));
    db()->prepare("INSERT INTO tokens (token, user_id, expires_at) VALUES (?,?, datetime('now','+30 days'))")
        ->execute([$token, $userId]);
    return $token;
}

function public_user(array $u): array
{
    return [
        'id' => (int)$u['id'],
        'name' => $u['name'],
        'username' => $u['username'],
        'email' => $u['email'],
        'role' => $u['role'],
        'status' => $u['status'],
        'avatar' => $u['avatar'] ?? '',
        'created_at' => $u['created_at'],
    ];
}

/* ---------------- التوجيه ---------------- */

function route(string $method, string $path, array $query, array $headers, array $in): array
{
    $path = '/' . trim($path, '/');
    $seg = explode('/', trim($path, '/'));   // [auth, login] ...

    if ($path === '/health') return j(200, ['ok' => true, 'time' => date('c'), 'php' => PHP_VERSION]);

    /* ===== المصادقة ===== */
    if (($seg[0] ?? '') === 'auth') {
        $action = $seg[1] ?? '';

        if ($method === 'POST' && $action === 'register') {
            $name = trim($in['name'] ?? '');
            $username = strtolower(trim($in['username'] ?? ''));
            $email = strtolower(trim($in['email'] ?? ''));
            $password = $in['password'] ?? '';
            if ($name === '' || $username === '' || $email === '' || $password === '') throw new ApiError('جميع الحقول مطلوبة');
            if (!preg_match('/^[a-z0-9_]{3,20}$/', $username)) throw new ApiError('اسم المستخدم: 3-20 حرفاً إنجليزياً/رقماً');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new ApiError('البريد الإلكتروني غير صالح');
            if (strlen($password) < 6) throw new ApiError('كلمة المرور 6 أحرف على الأقل');
            $pdo = db();
            $st = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
            $st->execute([$username, $email]);
            if ($st->fetch()) throw new ApiError('اسم المستخدم أو البريد مسجّل مسبقاً', 409);
            $pdo->prepare('INSERT INTO users (name, username, email, password) VALUES (?,?,?,?)')
                ->execute([$name, $username, $email, password_hash($password, PASSWORD_DEFAULT)]);
            $id = (int)$pdo->lastInsertId();
            $st = $pdo->prepare('SELECT * FROM users WHERE id = ?');
            $st->execute([$id]);
            $u = $st->fetch();
            return j(201, ['token' => issue_token($id), 'user' => public_user($u)]);
        }

        if ($method === 'POST' && $action === 'login') {
            $identifier = strtolower(trim($in['identifier'] ?? $in['username'] ?? ''));
            $password = $in['password'] ?? '';
            if ($identifier === '' || $password === '') throw new ApiError('أدخل بيانات الدخول');
            $st = db()->prepare('SELECT * FROM users WHERE username = ? OR email = ?');
            $st->execute([$identifier, $identifier]);
            $u = $st->fetch();
            if (!$u || !password_verify($password, $u['password'])) throw new ApiError('بيانات الدخول غير صحيحة', 401);
            if ($u['status'] === 'banned') throw new ApiError('هذا الحساب محظور — راجع الإدارة', 403);
            return j(200, ['token' => issue_token((int)$u['id']), 'user' => public_user($u)]);
        }

        if ($method === 'POST' && $action === 'logout') {
            $token = bearer_token($headers);
            if ($token && $token !== 'local') db()->prepare('DELETE FROM tokens WHERE token = ?')->execute([$token]);
            return j(200, ['ok' => true]);
        }

        if ($method === 'GET' && $action === 'me') {
            $u = require_user($headers);
            return j(200, ['user' => public_user($u)]);
        }

        if ($method === 'PUT' && $action === 'profile') {
            $u = require_user($headers);
            $name = trim($in['name'] ?? $u['name']);
            if ($name === '') throw new ApiError('الاسم مطلوب');
            db()->prepare('UPDATE users SET name = ? WHERE id = ?')->execute([$name, $u['id']]);
            $u['name'] = $name;
            return j(200, ['user' => public_user($u)]);
        }
    }

    /* ===== الثيمات ===== */
    if ($path === '/themes' && $method === 'GET') {
        $all = ($query['all'] ?? '') === '1' && current_user($headers) && current_user($headers)['role'] === 'admin';
        $rows = db()->query($all ? 'SELECT * FROM themes ORDER BY id' : 'SELECT * FROM themes WHERE published = 1 ORDER BY id')->fetchAll();
        foreach ($rows as &$r) {
            $r['data'] = $r['data'] ? json_decode($r['data'], true) : null;
            $r['published'] = (int)$r['published'];
        }
        return j(200, ['themes' => $rows, 'count' => count($rows)]);
    }

    /* ===== القوالب ===== */
    if (($seg[0] ?? '') === 'templates') {
        $u = require_user($headers);
        $id = isset($seg[1]) && $seg[1] !== '' ? (int)$seg[1] : 0;

        if ($method === 'GET' && !$id) {
            $st = db()->prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY updated_at DESC');
            $st->execute([$u['id']]);
            $rows = $st->fetchAll();
            foreach ($rows as &$r) { $r['data'] = json_decode($r['data'], true); $r['featured'] = (int)$r['featured']; }
            return j(200, ['templates' => $rows]);
        }
        if ($method === 'GET' && $id) {
            return j(200, ['template' => fetch_template($id, $u)]);
        }
        if ($method === 'POST' && !$id) {
            $name = trim($in['name'] ?? '') ?: 'قالب بلا اسم';
            if (!isset($in['data']) || !is_array($in['data'])) throw new ApiError('بيانات القالب مطلوبة');
            $data = json_encode($in['data'], JSON_UNESCAPED_UNICODE);
            $pdo = db();
            $pdo->prepare('INSERT INTO templates (user_id, name, description, theme_key, data) VALUES (?,?,?,?,?)')
                ->execute([$u['id'], $name, $in['description'] ?? '', $in['theme_key'] ?? '', $data]);
            $newId = (int)$pdo->lastInsertId();
            return j(201, ['template' => fetch_template($newId, $u), 'id' => $newId]);
        }
        if ($method === 'PUT' && $id) {
            $t = fetch_template($id, $u);
            $pdo = db();
            $pdo->prepare("UPDATE templates SET name = ?, description = ?, data = ?, updated_at = datetime('now') WHERE id = ?")
                ->execute([
                    trim($in['name'] ?? '') ?: $t['name'],
                    $in['description'] ?? $t['description'],
                    isset($in['data']) ? json_encode($in['data'], JSON_UNESCAPED_UNICODE) : $t['data_raw'],
                    $id,
                ]);
            return j(200, ['template' => fetch_template($id, $u)]);
        }
        if ($method === 'DELETE' && $id) {
            fetch_template($id, $u); // فحص الملكية
            db()->prepare('DELETE FROM templates WHERE id = ?')->execute([$id]);
            return j(200, ['ok' => true]);
        }
    }

    /* ===== الإدارة ===== */
    if (($seg[0] ?? '') === 'admin') {
        $admin = require_admin($headers);
        $area = $seg[1] ?? '';
        $id = isset($seg[2]) && $seg[2] !== '' ? (int)$seg[2] : 0;

        if ($area === 'stats' && $method === 'GET') {
            $pdo = db();
            return j(200, ['stats' => [
                'users' => (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
                'templates' => (int)$pdo->query('SELECT COUNT(*) FROM templates')->fetchColumn(),
                'themes' => (int)$pdo->query('SELECT COUNT(*) FROM themes')->fetchColumn(),
                'featured' => (int)$pdo->query('SELECT COUNT(*) FROM templates WHERE featured = 1')->fetchColumn(),
                'active' => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE status = 'active'")->fetchColumn(),
            ]]);
        }

        if ($area === 'users') {
            if ($method === 'GET' && !$id) {
                $rows = db()->query(
                    'SELECT u.*, (SELECT COUNT(*) FROM templates t WHERE t.user_id = u.id) AS templates_count
                     FROM users u ORDER BY u.id'
                )->fetchAll();
                return j(200, ['users' => array_map(function ($r) {
                    $p = public_user($r);
                    $p['templates_count'] = (int)$r['templates_count'];
                    unset($p['status']);
                    $p['status'] = $r['status'];
                    return $p;
                }, $rows)]);
            }
            if ($method === 'PUT' && $id) {
                $st = db()->prepare('SELECT * FROM users WHERE id = ?');
                $st->execute([$id]);
                $target = $st->fetch();
                if (!$target) throw new ApiError('المستخدم غير موجود', 404);
                if ($target['username'] === 'admin' && (($in['role'] ?? 'admin') !== 'admin' || ($in['status'] ?? 'active') !== 'active'))
                    throw new ApiError('لا يمكن تعديل دور/حالة المدير الرئيسي', 403);
                $role = in_array($in['role'] ?? $target['role'], ['user', 'admin'], true) ? ($in['role'] ?? $target['role']) : $target['role'];
                $status = in_array($in['status'] ?? $target['status'], ['active', 'banned'], true) ? ($in['status'] ?? $target['status']) : $target['status'];
                db()->prepare('UPDATE users SET role = ?, status = ? WHERE id = ?')->execute([$role, $status, $id]);
                return j(200, ['ok' => true]);
            }
            if ($method === 'DELETE' && $id) {
                if ((int)$admin['id'] === $id) throw new ApiError('لا يمكنك حذف حسابك', 403);
                $st = db()->prepare('SELECT username FROM users WHERE id = ?');
                $st->execute([$id]);
                $row = $st->fetch();
                if (!$row) throw new ApiError('المستخدم غير موجود', 404);
                if ($row['username'] === 'admin') throw new ApiError('لا يمكن حذف المدير الرئيسي', 403);
                db()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
                return j(200, ['ok' => true]);
            }
        }

        if ($area === 'templates') {
            if ($method === 'GET' && !$id) {
                $rows = db()->query(
                    'SELECT t.*, u.name AS user_name, u.username FROM templates t JOIN users u ON u.id = t.user_id ORDER BY t.updated_at DESC'
                )->fetchAll();
                foreach ($rows as &$r) { $r['data'] = json_decode($r['data'], true); $r['featured'] = (int)$r['featured']; }
                return j(200, ['templates' => $rows]);
            }
            if ($method === 'PUT' && $id) {
                $pdo = db();
                if (isset($in['featured'])) $pdo->prepare('UPDATE templates SET featured = ? WHERE id = ?')->execute([$in['featured'] ? 1 : 0, $id]);
                return j(200, ['ok' => true]);
            }
            if ($method === 'DELETE' && $id) {
                db()->prepare('DELETE FROM templates WHERE id = ?')->execute([$id]);
                return j(200, ['ok' => true]);
            }
        }

        if ($area === 'themes') {
            if ($method === 'POST' && $path === '/admin/themes') {
                $pdo = db();
                $id = (int)($in['id'] ?? 0);
                if ($id) {
                    $st = $pdo->prepare('SELECT * FROM themes WHERE id = ?');
                    $st->execute([$id]);
                    $th = $st->fetch();
                    if (!$th) throw new ApiError('الثيم غير موجود', 404);
                    $pdo->prepare('UPDATE themes SET name = ?, name_ar = ?, category = ?, published = ?, data = COALESCE(?, data) WHERE id = ?')
                        ->execute([
                            $in['name'] ?? $th['name'],
                            $in['name_ar'] ?? $th['name_ar'],
                            $in['category'] ?? $th['category'],
                            isset($in['published']) ? ((int)$in['published'] ? 1 : 0) : (int)$th['published'],
                            isset($in['data']) ? json_encode($in['data'], JSON_UNESCAPED_UNICODE) : null,
                            $id,
                        ]);
                    return j(200, ['ok' => true, 'id' => $id]);
                }
                $key = trim($in['key'] ?? '');
                if ($key === '') throw new ApiError('مفتاح الثيم مطلوب');
                $data = isset($in['data']) ? json_encode($in['data'], JSON_UNESCAPED_UNICODE) : null;
                $pdo->prepare('INSERT INTO themes (key, name, name_ar, category, layout, data, published) VALUES (?,?,?,?,?,?,?)')
                    ->execute([$key, $in['name'] ?? $key, $in['name_ar'] ?? $in['name'] ?? $key, $in['category'] ?? 'مخصص', $in['layout'] ?? 'landing', $data, isset($in['published']) ? (int)$in['published'] : 1]);
                return j(201, ['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
            }
            if ($method === 'DELETE' && $id) {
                db()->prepare('DELETE FROM themes WHERE id = ?')->execute([$id]);
                return j(200, ['ok' => true]);
            }
            if ($method === 'POST' && $path === '/admin/themes/reset') {
                seed_themes(db());
                return j(200, ['ok' => true, 'count' => (int)db()->query('SELECT COUNT(*) FROM themes')->fetchColumn()]);
            }
        }
    }

    throw new ApiError('المسار غير موجود: ' . $method . ' ' . $path, 404);
}

function fetch_template(int $id, array $u): array
{
    $st = db()->prepare('SELECT t.*, uname.name AS user_name FROM templates t JOIN users uname ON uname.id = t.user_id WHERE t.id = ?');
    $st->execute([$id]);
    $t = $st->fetch();
    if (!$t) throw new ApiError('القالب غير موجود', 404);
    if ((int)$t['user_id'] !== (int)$u['id'] && $u['role'] !== 'admin') throw new ApiError('ليس لديك صلاحية على هذا القالب', 403);
    $out = $t;
    $out['data_raw'] = $t['data'];
    $out['data'] = json_decode($t['data'], true);
    $out['featured'] = (int)$t['featured'];
    return $out;
}
