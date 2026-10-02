<?php
/* ============================================================
   قاعدة البيانات — PDO + SQLite (إنشاء + ترحيل + بذر)
   ============================================================ */

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    $file = $dir . '/app.sqlite';

    $pdo = new PDO('sqlite:' . $file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA busy_timeout = 5000');
    $pdo->exec('PRAGMA foreign_keys = ON');

    migrate($pdo);
    seed($pdo);
    return $pdo;
}

function migrate(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT NOT NULL DEFAULT 'active',
        avatar TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL DEFAULT '',
        name_ar TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        layout TEXT NOT NULL DEFAULT 'landing',
        data TEXT,
        published INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL DEFAULT 'قالب بلا اسم',
        description TEXT DEFAULT '',
        theme_key TEXT DEFAULT '',
        featured INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
}

function seed(PDO $pdo): void
{
    /* ---- المستخدمون الافتراضيون ---- */
    $count = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($count === 0) {
        $ins = $pdo->prepare('INSERT INTO users (name, username, email, password, role) VALUES (?,?,?,?,?)');
        $ins->execute(['المدير العام', 'admin', 'admin@studio.app', password_hash('admin123', PASSWORD_DEFAULT), 'admin']);
        $ins->execute(['مستخدم تجريبي', 'demo', 'demo@studio.app', password_hash('demo123', PASSWORD_DEFAULT), 'user']);
    } else {
        /* التأكد دائماً من وجود المدير admin/admin123 */
        $st = $pdo->prepare('SELECT id FROM users WHERE username = ?');
        $st->execute(['admin']);
        if (!$st->fetch()) {
            $pdo->prepare('INSERT INTO users (name, username, email, password, role) VALUES (?,?,?,?,?)')
                ->execute(['المدير العام', 'admin', 'admin@studio.app', password_hash('admin123', PASSWORD_DEFAULT), 'admin']);
        }
    }

    /* ---- الثيمات الثلاثون ---- */
    $tc = (int)$pdo->query('SELECT COUNT(*) FROM themes')->fetchColumn();
    if ($tc === 0) seed_themes($pdo);
}

function seed_themes(PDO $pdo): void
{
    $file = __DIR__ . '/seed/themes.seed.json';
    if (!is_file($file)) return;
    $themes = json_decode(file_get_contents($file), true);
    if (!is_array($themes)) return;
    $pdo->exec('DELETE FROM themes');
    $ins = $pdo->prepare('INSERT INTO themes (key, name, name_ar, category, layout, data, published) VALUES (?,?,?,?,?,?,1)');
    foreach ($themes as $t) {
        $ins->execute([
            $t['key'],
            $t['name'] ?? '',
            $t['name_ar'] ?? '',
            $t['category'] ?? '',
            $t['layout'] ?? 'landing',
            json_encode($t['data'] ?? null, JSON_UNESCAPED_UNICODE),
        ]);
    }
}
