PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pen_name TEXT UNIQUE NOT NULL,
  city TEXT DEFAULT 'Nusantara',
  bio TEXT DEFAULT 'Goresan perenungan rasa dan bait kata.',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, email_verified INTEGER NOT NULL DEFAULT 1);
INSERT INTO "users" ("id","email","password_hash","pen_name","city","bio","created_at","email_verified") VALUES('9662f538-4357-45c0-b2fd-3915066cef2d','haeru@berbirru.com','pbkdf2$sha256$10000$40bTEH8pF3lfbGsSmeQz1g==$cs8b9yNou60LKlPtnVwnxJ+RWBIOOfNHS79gc+k6ENo=','birru1717','Bawah Sadar','Goresan perenungan rasa dan bait kata.','2026-10-09 01:25:51',1);
CREATE TABLE otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT, -- NULL for original warkah, or post_id for estafet chains
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  chains_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, title TEXT,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO "posts" ("id","author_id","content","parent_id","likes_count","saves_count","chains_count","created_at","title") VALUES('e9d0b3bd-a034-45fc-9c6f-615b902708e3','9662f538-4357-45c0-b2fd-3915066cef2d','<b>Hidup Jokowi!!!&nbsp;</b>',NULL,0,0,0,'2026-10-12 04:37:46','Apa Kabar Indonesia');
CREATE TABLE likes (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
CREATE TABLE bookmarks (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
CREATE TABLE follows (
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  type TEXT NOT NULL,
  post_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP NOT NULL
);
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:nt:43.163.117.65',1,'2026-10-11 00:26:08');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('pw:probe-tidak-ada@example.com',5,'2026-10-10 16:56:45');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:187.40.235.78',1,'2026-10-10 17:04:41');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:187.40.232.55',1,'2026-10-10 22:20:17');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:nt:187.40.232.55',4,'2026-10-10 17:27:57');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:187.15.91.14',2,'2026-10-11 00:53:52');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:otp:187.15.91.14',1,'2026-10-11 01:00:26');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('otp:haeru@berbirru.com',1,'2026-10-15 00:36:14');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('votp:ip:187.15.91.14',1,'2026-10-11 01:00:57');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('votp:haeru@berbirru.com',1,'2026-10-11 01:00:57');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('votp:ip:43.163.117.65',1,'2026-10-11 13:04:03');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('votp:tidak-ada@contoh.invalid',1,'2026-10-11 13:04:03');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:otp:nt:43.163.117.65',1,'2026-10-11 13:09:03');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('otp:tidak-ada@contoh.invalid',1,'2026-10-11 13:09:03');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:187.14.92.212',1,'2026-10-11 14:43:53');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:2400:9800:350:2b96:18dd:a34f:7299:85b5',1,'2026-10-12 03:20:31');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:2400:9800:308:913:18dd:a9dc:363:9321',1,'2026-10-12 04:41:23');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:2400:9800:318:eb90:18dd:b924:80ab:e9c1',1,'2026-10-12 09:10:12');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:nt:2400:9800:318:eb90:18dd:b924:80ab:e9c1',1,'2026-10-12 09:20:21');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:209.46.39.15',1,'2026-10-14 14:37:52');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:nt:209.46.39.15',3,'2026-10-14 14:48:07');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:otp:2400:9800:318:54e:18de:8bfc:cf63:e2ce',1,'2026-10-15 00:31:14');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:187.14.92.232',1,'2026-10-15 04:37:57');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:187.40.232.164',1,'2026-10-16 02:52:09');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('post:9662f538-4357-45c0-b2fd-3915066cef2d',1,'2026-10-15 15:14:23');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:nt:187.40.236.34',1,'2026-10-16 10:50:41');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:187.40.232.7',1,'2026-10-16 12:25:28');
INSERT INTO "rate_limits" ("key","count","expires_at") VALUES('rl:login:187.40.232.66',1,'2026-10-17 00:24:44');
CREATE TABLE IF NOT EXISTS "sessions" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT,
  token_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO "sessions" ("id","user_id","token","token_hash","ip_address","user_agent","expires_at","created_at") VALUES('bb1f8dcc-1488-4af5-96e2-14e81fdbfa78','9662f538-4357-45c0-b2fd-3915066cef2d','otp_pbkdf2$sha256$10000$HOiUXANOUqA7rENKf8nvCw==$vt2+FmFIhamsP0ZBO3RECvvJwa9naLZHgbjm2UrNAtk=',NULL,NULL,NULL,'2026-10-15 00:31:14','2026-10-15 00:21:14');
INSERT INTO "sessions" ("id","user_id","token","token_hash","ip_address","user_agent","expires_at","created_at") VALUES('fdc56de0-8b1b-4990-bbec-0f10d39c20f5','9662f538-4357-45c0-b2fd-3915066cef2d',NULL,'d9b8190c80bdd3a7236c223b0656423c8586d59201fa13374ee2822921134ca2',NULL,NULL,'2026-11-14 16:39:18','2026-10-15 16:39:18');
INSERT INTO "sessions" ("id","user_id","token","token_hash","ip_address","user_agent","expires_at","created_at") VALUES('48f5d012-af02-4b2b-ba39-caa6c5c6f8fe','9662f538-4357-45c0-b2fd-3915066cef2d',NULL,'3a421a9a123849e9f38eda03a8e0ce0a9a6771e6eb45abb8be0d23e0e1bb53bf',NULL,NULL,'2026-11-15 02:47:09','2026-10-16 02:47:09');
INSERT INTO "sessions" ("id","user_id","token","token_hash","ip_address","user_agent","expires_at","created_at") VALUES('7bf7f983-1fc7-4765-a0bc-c3dc581d20cd','9662f538-4357-45c0-b2fd-3915066cef2d',NULL,'23b10c82eea5457241e20ad30a7b8a9a93f7c06a016e87122eda23b507ed238a',NULL,NULL,'2026-11-15 10:35:41','2026-10-16 10:35:41');
INSERT INTO "sessions" ("id","user_id","token","token_hash","ip_address","user_agent","expires_at","created_at") VALUES('94833acc-05b4-449d-857c-30b6f7727f0b','9662f538-4357-45c0-b2fd-3915066cef2d',NULL,'f89bf44e491420102e8a9d4bb5287ec49db489d872c5189aaa292b3df18aa1da',NULL,NULL,'2026-11-15 12:20:28','2026-10-16 12:20:28');
INSERT INTO "sessions" ("id","user_id","token","token_hash","ip_address","user_agent","expires_at","created_at") VALUES('edab51e1-0c20-4794-8a08-e394a8b05b9b','9662f538-4357-45c0-b2fd-3915066cef2d',NULL,'6c74ef71b371c876a0cd8a780689fc1f3ae37c78eb2fc20305a4f99d9de8e247',NULL,NULL,'2026-11-16 00:19:44','2026-10-17 00:19:44');
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_parent ON posts(parent_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_users_pen_name ON users(pen_name);
CREATE INDEX idx_notif_user ON notifications(user_id, is_read);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
