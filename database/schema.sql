-- Maid Café DreamGarden — Database Schema
-- MariaDB / MySQL compatible

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─────────────────────────────────────────────
-- Admin users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email         VARCHAR(100),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Blog posts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    title_en     VARCHAR(255),
    slug         VARCHAR(255) NOT NULL UNIQUE,
    excerpt      TEXT,
    excerpt_en   TEXT,
    content      LONGTEXT,
    content_en   LONGTEXT,
    cover_image  VARCHAR(500),
    published    TINYINT(1) NOT NULL DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_published (published, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Members (maids & butlers)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    name_jp     VARCHAR(100),
    role        ENUM('maid','butler','manager') NOT NULL DEFAULT 'maid',
    description TEXT,
    image       VARCHAR(500),
    theme_color VARCHAR(20) DEFAULT '#FF6B9D',
    active      TINYINT(1) NOT NULL DEFAULT 1,
    sort_order  SMALLINT UNSIGNED DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Menu categories
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_categories (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    name_jp    VARCHAR(100),
    icon       VARCHAR(100),
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Menu items
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED,
    name        VARCHAR(200) NOT NULL,
    name_jp     VARCHAR(200),
    description TEXT,
    price       DECIMAL(10,2) NOT NULL,
    image       VARCHAR(500),
    available   TINYINT(1) NOT NULL DEFAULT 1,
    sort_order  SMALLINT UNSIGNED DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
    INDEX idx_category (category_id, available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Seed data
-- ─────────────────────────────────────────────

INSERT INTO menu_categories (name, name_jp, icon, sort_order) VALUES
  ('Drinks',   '飲み物', 'Cup',      1),
  ('Food',     '食べ物', 'UtensilsCrossed', 2),
  ('Desserts', 'デザート', 'Cake',  3),
  ('Sets',     'セット', 'Star',      4);

INSERT INTO menu_items (category_id, name, name_jp, description, price, available, sort_order) VALUES
  (1, 'Matcha Latte',          '抹茶ラテ',    'Creamy matcha with sweet milk foam',                  8.50, 1, 1),
  (1, 'Sakura Rose Tea',       '桜ロゼティー', 'Delicate cherry blossom tea blend',                   7.00, 1, 2),
  (1, 'Maid Special Cocoa',    'メイドココア', 'Latte art cocoa drawn by your maid',                  9.00, 1, 3),
  (1, 'Peach Milk Soda',       '桃ミルクソーダ','Bubbly peach soda with creamy milk float',           8.00, 1, 4),
  (2, 'Omu-Rice (Moe Style)',  '萌えオムライス','Ketchup rice omelette with heart art',              16.00, 1, 1),
  (2, 'Dream Sandwich',        'ドリームサンド', 'Croque monsieur with maid seasoning',               15.50, 1, 2),
  (3, 'Cherry Blossom Parfait','桜パフェ',     'Layers of cream, mochi & sakura jelly',              12.00, 1, 1),
  (3, 'Strawberry Pancakes',   'いちごパンケーキ','Fluffy pancakes with fresh strawberries',           11.50, 1, 2),
  (3, 'Moe Moe Crepe',        '萌えクレープ', 'Sweet crepe with whipped cream & berries',            10.00, 1, 3),
  (4, 'Welcome Set',           'ウェルカムセット','Drink + dessert + maid photo',                    24.00, 1, 1),
  (4, 'Dream Garden Set',      'ドリームガーデンセット','Omu-rice + drink + parfait',                35.00, 1, 2);

INSERT INTO members (name, name_jp, role, description, image, theme_color, sort_order) VALUES
  ('Ivy',    'アイビー',  'maid',    'Sweet and cheerful, Ivy loves flowers and tea ceremonies.', NULL, '#7CB878', 1),
  ('Felix',  'フェリクス','butler',  'Elegant and refined, Felix is always ready to serve with a smile.', NULL, '#6B9FD4', 2),
  ('Chocola','ショコラ',  'maid',    'Sweet as chocolate, she brings warmth and joy to every event.', '/uploads/member_chocola.jpg', '#C17B5A', 3),
  ('Leaf',   'リーフ',    'maid',    'Calm and graceful, Leaf brings the peace of nature to the café.', NULL, '#5FB35F', 4),
  ('Mail',   'メイル',    'maid',    'Lively and energetic, Mail loves games and entertaining guests.', NULL, '#FF8FA3', 5),
  ('Vitya',  'ヴィーチャ','maid',    'Cool and mysterious, Vitya captivates with her icy blue charm.', NULL, '#89CFF0', 6),
  ('Tsuki',  'ツキ',      'maid',    'Moonlit and dreamy, Tsuki whispers stars into every cup.', NULL, '#C9A7EB', 7),
  ('Akii',   'アキイ',    'maid',    'Maid Akii mit ihren charakteristischen dunklen Zöpfen und der blauen Schleife. ✨', '/uploads/member_akii.jpg', '#BAE6FD', 8),
  ('Maii',   'マイ',      'maid',    'Maid Maii (auch bekannt als Alice) — unsere süsse Bunny-Maid mit Brille. ʕ•ᴥ•ʔ', '/uploads/member_maii.jpg', '#FFB7D5', 9),
  ('Lumen',  'ルーメン',  'maid',    'Maid Lumen — unsere helle Sternen-Maid! Pokemon-Enthusiastin. 💡🖤', '/uploads/member_lumen.jpg', '#DDD6FE', 10),
  ('Taro',   'タロ',      'maid',    'Maid Taro — Kochprofi und Bäckerin des DreamGardens. (о´∀´о) 🍰', '/uploads/member_taro.jpg', '#FED7AA', 11);
