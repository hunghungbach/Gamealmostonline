require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.PORT || 3000);
const root = __dirname;

function initializeDataFiles(rootDir = root) {
  const dataDir = path.join(rootDir, 'data');
  const usersFile = path.join(dataDir, 'users.json');
  const reportsFile = path.join(dataDir, 'reports.json');

  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(reportsFile)) {
    fs.writeFileSync(reportsFile, JSON.stringify({ reports: [], appeals: [], notifications: [] }, null, 2));
  }

  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]');
  }

  return { dataDir, usersFile, reportsFile };
}

const { dataDir, usersFile, reportsFile } = initializeDataFiles(root);
const databaseUrl = String(process.env.DATABASE_URL || '').trim();
const dbPool = databaseUrl ? new Pool({
  connectionString: databaseUrl,
  ssl: String(process.env.DATABASE_SSL || '').toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined
}) : null;
const pending = new Map();       // đăng ký
const forgot = new Map();        // quên mật khẩu
const sessions = new Map();      // session đăng nhập
const loginAttempts = new Map(); // chống brute-force

function getSmtpStatus(env = process.env) {
  const host = String(env.SMTP_HOST || '').trim();
  const user = String(env.SMTP_USER || '').trim();
  const pass = String(env.SMTP_PASS || '').trim();

  if (!host) {
    return { enabled: false, host: null, user: null, message: 'SMTP_HOST chưa được cấu hình. Cần thêm SMTP_HOST=smtp.gmail.com vào .env.' };
  }

  if (!user || !pass) {
    return { enabled: false, host, user, pass: null, message: 'SMTP_USER và SMTP_PASS chưa được nhập. Dùng email thật và App Password.' };
  }

  const placeholderValues = new Set([
    'your-email@gmail.com',
    'your-gmail-app-password',
    'example@gmail.com',
    'your-email',
    'your-app-password',
    'change-me'
  ]);

  const isPlaceholder = [user, pass].some(value => {
    const normalized = String(value || '').trim().toLowerCase();
    return placeholderValues.has(normalized) || normalized.includes('your-') || normalized.includes('example') || normalized.includes('change-me');
  });

  if (isPlaceholder) {
    return {
      enabled: false,
      host,
      user,
      pass: null,
      message: 'Bạn đang dùng email mẫu / App Password mẫu. Thay bằng tài khoản Gmail thật và App Password thực để gửi OTP qua email.'
    };
  }

  return { enabled: true, host, user, pass: '[configured]', message: 'SMTP đã được cấu hình.' };
}

app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (request.method === 'OPTIONS') return response.sendStatus(204);
  next();
});
app.use(express.json({ limit: '20kb' }));
app.use(express.static(root));

const smtpStatus = getSmtpStatus();
const mailer = smtpStatus.enabled ? nodemailer.createTransport({
  host: smtpStatus.host,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
}) : null;

if (!smtpStatus.enabled) {
  console.warn('[mail] SMTP chưa sẵn sàng. Email OTP sẽ bị từ chối cho đến khi cấu hình Gmail thật + App Password.');
} else {
  console.log('[mail] SMTP ready. Mã xác nhận sẽ được gửi qua email thật.');
}

/* ===================== HELPERS ===================== */
function readUsersFromFile() {
  try {
    const raw = fs.readFileSync(usersFile, 'utf8').trim();
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('[users] Unable to read users file, resetting to empty array.');
    return [];
  }
}
function readReportsFromFile() {
  try {
    const raw = fs.readFileSync(reportsFile, 'utf8').trim();
    return raw ? JSON.parse(raw) : { reports: [], appeals: [], notifications: [] };
  } catch (error) {
    console.warn('[reports] Unable to read reports file, resetting to default structure.');
    return { reports: [], appeals: [], notifications: [] };
  }
}
let usersCache = readUsersFromFile();
let reportsCache = readReportsFromFile();
let dbWriteQueue = Promise.resolve();

function readUsers() { return usersCache; }
function readReports() { return reportsCache; }

function persistDatabase() {
  if (!dbPool) return Promise.resolve();
  const users = JSON.stringify(usersCache);
  const reports = JSON.stringify(reportsCache);
  dbWriteQueue = dbWriteQueue
    .then(() => dbPool.query(
      'UPDATE arcade_state SET users = $1::jsonb, reports = $2::jsonb, updated_at = NOW() WHERE id = 1',
      [users, reports]
    ))
    .catch(error => console.error('[postgres] Unable to persist data:', error.message));
  return dbWriteQueue;
}

function writeUsers(users) {
  usersCache = users;
  if (dbPool) persistDatabase();
  else fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function writeReports(data) {
  reportsCache = data;
  if (dbPool) persistDatabase();
  else fs.writeFileSync(reportsFile, JSON.stringify(data, null, 2));
}

async function initializeDatabase() {
  if (!dbPool) return false;
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS arcade_state (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      users JSONB NOT NULL,
      reports JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const result = await dbPool.query('SELECT users, reports FROM arcade_state WHERE id = 1');
  if (!result.rowCount) {
    await dbPool.query(
      'INSERT INTO arcade_state (id, users, reports) VALUES (1, $1::jsonb, $2::jsonb)',
      [JSON.stringify(usersCache), JSON.stringify(reportsCache)]
    );
  } else {
    usersCache = result.rows[0].users || [];
    reportsCache = result.rows[0].reports || { reports: [], appeals: [], notifications: [] };
  }
  console.log('[postgres] Connected. Arcade data is stored in PostgreSQL.');
  return true;
}

function pushNotification(userId, type, title, body) {
  const data = readReports();
  data.notifications.push({
    id: crypto.randomUUID(),
    userId, type, title, body,
    read: false,
    createdAt: new Date().toISOString()
  });
  writeReports(data);
}

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (error, key) =>
      error ? reject(error) : resolve(`${salt}:${key.toString('hex')}`)));
}

async function verifyPassword(password, stored) {
  try {
    const [salt, key] = String(stored).split(':');
    const derived = await hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(derived.split(':')[1], 'hex'), Buffer.from(key, 'hex'));
  } catch (e) { return false; }
}

function makeOtp() { return String(crypto.randomInt(100000, 1000000)); }
function hashOtp(code) { return crypto.createHash('sha256').update(String(code)).digest('hex'); }

function publicUser(user) {
  return {
    id: user.id, name: user.name, email: user.email,
    role: user.role || 'user', locked: Boolean(user.locked),
    lockReason: user.lockReason || null,
    lockedAt: user.lockedAt || null,
    lockedBy: user.lockedBy || null,
    createdAt: user.createdAt, lastLoginAt: user.lastLoginAt,
    loginCount: user.loginCount || 0
  };
}

function tokenFor(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  return token;
}

function authUser(request) {
  const header = request.headers.authorization || '';
  const session = sessions.get(header.replace('Bearer ', ''));
  if (!session || session.expires < Date.now()) return null;
  return readUsers().find(user => user.id === session.userId) || null;
}

function requireAuth(request, response, next) {
  const user = authUser(request);
  if (!user) return response.status(401).json({ message: 'Phiên đăng nhập đã hết hạn.' });
  request.user = user;
  next();
}

function requireActive(request, response, next) {
  const user = authUser(request);
  if (!user) return response.status(401).json({ message: 'Phiên đăng nhập đã hết hạn.' });
  if (user.locked) return response.status(403).json({
    message: 'Tài khoản đã bị khóa.',
    locked: true,
    lockReason: user.lockReason
  });
  request.user = user;
  next();
}

function requireAdmin(request, response, next) {
  const user = authUser(request);
  if (!user) return response.status(401).json({ message: 'Chưa đăng nhập.' });
  if (user.locked) return response.status(403).json({ message: 'Tài khoản đã bị khóa.', locked: true, lockReason: user.lockReason });
  if (user.role !== 'admin') return response.status(403).json({ message: 'Chỉ admin mới có quyền này.' });
  request.user = user;
  next();
}

async function sendOtp(email, code, subject = 'Mã xác nhận Arcade Hub') {
  if (!mailer) throw new Error('SMTP chưa được cấu hình.');
  await mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email, subject,
    text: `Mã của bạn là ${code}. Hiệu lực 10 phút.`,
    html: `<h2>Arcade Hub</h2><p>Mã của bạn:</p><h1>${code}</h1><p>Hiệu lực 10 phút.</p>`
  });
  return true;
}

function validateCredentials(name, email, password) {
  if (!/^\S+@\S+\.\S+$/.test(email)) return 'Email không hợp lệ.';
  if (password.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự.';
  if (name !== undefined && (name.length < 2 || name.length > 30)) return 'Biệt danh cần từ 2 đến 30 ký tự.';
  return null;
}

/* ===================== AUTH ===================== */
app.post('/api/auth/register', async (request, response) => {
  try {
    const name = String(request.body.name || '').trim();
    const email = normalizeEmail(request.body.email);
    const password = String(request.body.password || '');
    const err = validateCredentials(name, email, password);
    if (err) return response.status(400).json({ message: err });
    if (readUsers().some(u => u.email === email))
      return response.status(409).json({ message: 'Email đã được đăng ký.' });

    const code = makeOtp();
    const record = {
      name, email,
      passwordHash: await hashPassword(password),
      codeHash: hashOtp(code),
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0
    };
    await sendOtp(email, code);
    pending.set(email, record);
    response.json({ message: 'Mã xác nhận đã được gửi.' });
  } catch (e) {
    console.error('[mail] Không thể gửi OTP đăng ký:', e.message);
    response.status(503).json({ message: 'Không thể gửi email xác nhận. Kiểm tra cấu hình SMTP rồi thử lại.' });
  }
});

app.post('/api/auth/resend', async (request, response) => {
  const email = normalizeEmail(request.body.email);
  const record = pending.get(email);
  if (!record) return response.status(400).json({ message: 'Phiên đăng ký đã hết.' });
  const code = makeOtp();
  try {
    await sendOtp(email, code);
    record.codeHash = hashOtp(code);
    record.expires = Date.now() + 10 * 60 * 1000;
    record.attempts = 0;
    response.json({ message: 'Đã gửi mã mới.' });
  } catch (e) {
    console.error('[mail] Không thể gửi lại OTP:', e.message);
    response.status(503).json({ message: 'Không thể gửi lại email xác nhận. Kiểm tra hộp thư và cấu hình SMTP.' });
  }
});

app.post('/api/auth/verify', (request, response) => {
  const email = normalizeEmail(request.body.email);
  const code = String(request.body.code || '').trim();
  const record = pending.get(email);
  if (!record || record.expires < Date.now())
    return response.status(400).json({ message: 'Mã đã hết hạn.' });
  if (!/^\d{6}$/.test(code) || hashOtp(code) !== record.codeHash) {
    record.attempts += 1;
    return response.status(400).json({ message: 'Mã không đúng.' });
  }
  const user = {
    id: crypto.randomUUID(),
    name: record.name, email,
    passwordHash: record.passwordHash,
    role: 'user', locked: false,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: null, loginCount: 0
  };
  const users = readUsers(); users.push(user); writeUsers(users);
  pending.delete(email);
  response.json({ user: publicUser(user), token: tokenFor(user) });
});

app.post('/api/auth/login', async (request, response) => {
  const email = normalizeEmail(request.body.email);
  const password = String(request.body.password || '');
  const key = email;
  const attempt = loginAttempts.get(key) || { count: 0, reset: Date.now() + 60 * 1000 };
  if (Date.now() > attempt.reset) { attempt.count = 0; attempt.reset = Date.now() + 60 * 1000; }
  if (attempt.count >= 5)
    return response.status(429).json({ message: 'Quá nhiều lần thử. Đợi 1 phút.' });

  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    attempt.count += 1;
    loginAttempts.set(key, attempt);
    return response.status(401).json({ message: 'Email hoặc mật khẩu chưa đúng.' });
  }

  loginAttempts.delete(key);
  user.lastLoginAt = new Date().toISOString();
  user.loginCount = (user.loginCount || 0) + 1;
  writeUsers(users);

  // KHÔNG chặn user bị khóa — trả về bình thường
  response.json({ user: publicUser(user), token: tokenFor(user) });
});

app.get('/api/auth/me', (request, response) => {
  const user = authUser(request);
  if (!user) return response.status(401).json({ message: 'Phiên đã hết hạn.' });
  if (user.locked) return response.status(403).json({
    message: 'Tài khoản đã bị khóa. Vui lòng vào trang khiếu nại.',
    locked: true,
    lockReason: user.lockReason || 'Không có lý do cụ thể.'
  });
  response.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (request, response) => {
  sessions.delete((request.headers.authorization || '').replace('Bearer ', ''));
  response.json({ message: 'Đã đăng xuất.' });
});

/* ===================== QUÊN MẬT KHẨU ===================== */
app.post('/api/auth/forgot', async (request, response) => {
  const email = normalizeEmail(request.body.email);
  const user = readUsers().find(u => u.email === email);
  if (!user) return response.json({ message: 'Nếu email tồn tại, mã đã được gửi.' });
  const code = makeOtp();
  try {
    await sendOtp(email, code, 'Đặt lại mật khẩu Arcade Hub');
    forgot.set(email, { codeHash: hashOtp(code), expires: Date.now() + 10 * 60 * 1000 });
    response.json({ message: 'Mã đặt lại đã được gửi.' });
  } catch (e) {
    console.error('[mail] Không thể gửi OTP đặt lại mật khẩu:', e.message);
    response.status(503).json({ message: 'Không thể gửi email đặt lại mật khẩu. Kiểm tra cấu hình SMTP rồi thử lại.' });
  }
});

app.post('/api/auth/reset', async (request, response) => {
  const email = normalizeEmail(request.body.email);
  const code = String(request.body.code || '').trim();
  const newPassword = String(request.body.password || '');
  const record = forgot.get(email);
  if (!record || record.expires < Date.now())
    return response.status(400).json({ message: 'Mã đã hết hạn.' });
  if (hashOtp(code) !== record.codeHash)
    return response.status(400).json({ message: 'Mã không đúng.' });
  if (newPassword.length < 8)
    return response.status(400).json({ message: 'Mật khẩu cần ít nhất 8 ký tự.' });

  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return response.status(404).json({ message: 'Không tìm thấy user.' });
  user.passwordHash = await hashPassword(newPassword);
  writeUsers(users);
  forgot.delete(email);
  response.json({ message: 'Đặt lại mật khẩu thành công.' });
});

/* ===================== USER TỰ QUẢN LÝ ===================== */
app.put('/api/user/profile', requireActive, (request, response) => {
  const name = String(request.body.name || '').trim();
  if (name.length < 2 || name.length > 30)
    return response.status(400).json({ message: 'Biệt danh cần từ 2 đến 30 ký tự.' });
  const users = readUsers();
  const user = users.find(u => u.id === request.user.id);
  user.name = name;
  writeUsers(users);
  response.json({ user: publicUser(user) });
});

app.put('/api/user/password', requireActive, async (request, response) => {
  const oldPassword = String(request.body.oldPassword || '');
  const newPassword = String(request.body.newPassword || '');
  if (newPassword.length < 8)
    return response.status(400).json({ message: 'Mật khẩu mới cần ≥ 8 ký tự.' });
  const users = readUsers();
  const user = users.find(u => u.id === request.user.id);
  if (!(await verifyPassword(oldPassword, user.passwordHash)))
    return response.status(401).json({ message: 'Mật khẩu cũ không đúng.' });
  user.passwordHash = await hashPassword(newPassword);
  writeUsers(users);
  response.json({ message: 'Đổi mật khẩu thành công.' });
});

app.delete('/api/user/me', requireActive, (request, response) => {
  const users = readUsers().filter(u => u.id !== request.user.id);
  writeUsers(users);
  sessions.clear();
  response.json({ message: 'Đã xóa tài khoản.' });
});

/* ===================== ADMIN ===================== */
app.get('/api/admin/stats', requireAdmin, (request, response) => {
  const users = readUsers();
  const today = new Date().toDateString();
  response.json({
    total: users.length,
    newToday: users.filter(u => new Date(u.createdAt).toDateString() === today).length,
    locked: users.filter(u => u.locked).length,
    admins: users.filter(u => u.role === 'admin').length
  });
});

app.get('/api/admin/users', requireAdmin, (request, response) => {
  const q = String(request.query.q || '').toLowerCase();
  const users = readUsers()
    .filter(u => !q || u.name.toLowerCase().includes(q) || u.email.includes(q))
    .map(publicUser);
  response.json({ users });
});

app.put('/api/admin/users/:id/role', requireAdmin, (request, response) => {
  const role = request.body.role === 'admin' ? 'admin' : 'user';
  const users = readUsers();
  const user = users.find(u => u.id === request.params.id);
  if (!user) return response.status(404).json({ message: 'Không tìm thấy user.' });
  if (user.id === request.user.id && role !== 'admin')
    return response.status(400).json({ message: 'Không thể tự hạ quyền chính mình.' });
  user.role = role;
  writeUsers(users);
  response.json({ user: publicUser(user) });
});

app.put('/api/admin/users/:id/lock', requireAdmin, (request, response) => {
  const locked = Boolean(request.body.locked);
  const reason = String(request.body.reason || '').trim().slice(0, 500);
  const users = readUsers();
  const user = users.find(u => u.id === request.params.id);
  if (!user) return response.status(404).json({ message: 'Không tìm thấy user.' });
  if (user.id === request.user.id)
    return response.status(400).json({ message: 'Không thể tự khóa chính mình.' });

  // Nếu khóa thì bắt buộc phải có lý do
  if (locked && reason.length < 10)
    return response.status(400).json({ message: 'Cần nhập lý do khóa (ít nhất 10 ký tự).' });

  user.locked = locked;
  if (locked) {
    user.lockReason = reason;
    user.lockedAt = new Date().toISOString();
    user.lockedBy = request.user.name;
  } else {
    user.lockReason = null;
    user.lockedAt = null;
    user.lockedBy = null;
  }
  writeUsers(users);

  // Gửi thông báo cho user
  if (locked) {
    pushNotification(
      user.id,
      'locked',
      '🔒 Tài khoản đã bị khóa',
      `Lý do: ${reason}. Nếu cho rằng đây là oan, hãy vào trang Khiếu nại để gửi đơn.`
    );
  } else {
    pushNotification(
      user.id,
      'unlocked',
      '✅ Tài khoản đã được mở khóa',
      `Admin đã mở khóa tài khoản của bạn. Bạn có thể chơi game trở lại.`
    );
  }

  response.json({ user: publicUser(user) });
});

app.delete('/api/admin/users/:id', requireAdmin, (request, response) => {
  const users = readUsers();
  const user = users.find(u => u.id === request.params.id);
  if (!user) return response.status(404).json({ message: 'Không tìm thấy user.' });
  if (user.id === request.user.id)
    return response.status(400).json({ message: 'Không thể tự xóa chính mình.' });
  writeUsers(users.filter(u => u.id !== request.params.id));
  response.json({ message: 'Đã xóa user.' });
});

/* ===================== APPEAL (KHIẾU NẠI) ===================== */
app.post('/api/appeal', requireAuth, (request, response) => {
  const reason = String(request.body.reason || '').trim().slice(0, 1000);
  const evidence = String(request.body.evidence || '').trim().slice(0, 300);

  if (reason.length < 20)
    return response.status(400).json({ message: 'Lý do khiếu nại cần ít nhất 20 ký tự.' });

  const data = readReports();

  // Mỗi user chỉ được gửi 1 khiếu nại đang chờ
  const pending = data.appeals.find(a => a.userId === request.user.id && a.status === 'pending');
  if (pending)
    return response.status(429).json({ message: 'Bạn đã có khiếu nại đang chờ xử lý.' });

  const appeal = {
    id: crypto.randomUUID(),
    userId: request.user.id,
    userName: request.user.name,
    userEmail: request.user.email,
    reason,
    evidence,
    status: 'pending',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    adminNote: ''
  };
  data.appeals.push(appeal);
  writeReports(data);

  // Thông báo cho tất cả admin
  const admins = readUsers().filter(u => u.role === 'admin');
  admins.forEach(a => {
    pushNotification(
      a.id,
      'appeal',
      'Khiếu nại mới',
      `${request.user.name} vừa gửi khiếu nại. Vào trang quản trị để xử lý.`
    );
  });

  response.json({ message: 'Đã gửi khiếu nại. Admin sẽ xem xét.' });
});

app.get('/api/appeal/me', requireAuth, (request, response) => {
  const data = readReports();
  const mine = data.appeals
    .filter(a => a.userId === request.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  response.json({ appeals: mine });
});

/* ===================== NOTIFICATIONS ===================== */
app.get('/api/notifications', requireActive, (request, response) => {
  const data = readReports();
  const mine = data.notifications
    .filter(n => n.userId === request.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);
  const unread = mine.filter(n => !n.read).length;
  response.json({ notifications: mine, unread });
});

app.put('/api/notifications/read', requireActive, (request, response) => {
  const data = readReports();
  data.notifications.forEach(n => {
    if (n.userId === request.user.id) n.read = true;
  });
  writeReports(data);
  response.json({ message: 'Đã đánh dấu đã đọc.' });
});

app.post('/api/report', requireActive, (request, response) => {
  const reportedId = String(request.body.reportedId || '').trim();
  const reason = String(request.body.reason || '').trim();
  const description = String(request.body.description || '').trim().slice(0, 500);
  const gameName = String(request.body.gameName || '').trim().slice(0, 100);
  const violationTime = String(request.body.violationTime || '').trim().slice(0, 40);
  const evidence = String(request.body.evidence || '').trim().slice(0, 300);
  const target = readUsers().find(user => user.id === reportedId && !user.locked);

  if (!target) return response.status(404).json({ message: 'Không tìm thấy người chơi này.' });
  if (target.id === request.user.id) return response.status(400).json({ message: 'Bạn không thể tự tố cáo mình.' });
  if (!reason || description.length < 10)
    return response.status(400).json({ message: 'Vui lòng chọn lý do và mô tả ít nhất 10 ký tự.' });

  const data = readReports();
  data.reports.push({
    id: crypto.randomUUID(), reporterId: request.user.id, reporterName: request.user.name,
    reportedId: target.id, reportedName: target.name, reason, description, gameName, violationTime, evidence,
    status: 'pending', adminNote: '', createdAt: new Date().toISOString(), reviewedAt: null, reviewedBy: null
  });
  writeReports(data);
  readUsers().filter(user => user.role === 'admin').forEach(admin => {
    pushNotification(admin.id, 'report', 'Tố cáo mới', `${request.user.name} đã tố cáo ${target.name}.`);
  });
  response.json({ message: 'Đã gửi tố cáo thành công.' });
});

/* ===================== ADMIN — REPORT MANAGEMENT ===================== */
app.get('/api/admin/reports', requireAdmin, (request, response) => {
  const data = readReports();
  const reports = data.reports
    .map(r => ({
      ...r,
      verifiedCount: countVerifiedReports(r.reportedId),
      priority: countVerifiedReports(r.reportedId)
    }))
    .sort((a, b) => b.priority - a.priority || new Date(b.createdAt) - new Date(a.createdAt));
  response.json({ reports });
});

app.put('/api/admin/reports/:id', requireAdmin, (request, response) => {
  const status = String(request.body.status || '');
  const adminNote = String(request.body.adminNote || '').trim().slice(0, 500);
  if (!['verified', 'dismissed', 'pending'].includes(status))
    return response.status(400).json({ message: 'Trạng thái không hợp lệ.' });

  const data = readReports();
  const report = data.reports.find(r => r.id === request.params.id);
  if (!report) return response.status(404).json({ message: 'Không tìm thấy tố cáo.' });

  report.status = status;
  report.adminNote = adminNote;
  report.reviewedAt = new Date().toISOString();
  report.reviewedBy = request.user.name;
  writeReports(data);

  // Nếu verify và đủ ngưỡng → tự động cảnh báo/khóa
  if (status === 'verified') {
    const verifiedCount = countVerifiedReports(report.reportedId);
    const users = readUsers();
    const target = users.find(u => u.id === report.reportedId);

    if (target) {
      if (verifiedCount >= REPORT_THRESHOLDS.AUTO_LOCK) {
        // Tự động khóa
        target.locked = true;
        target.lockReason = `Tự động khóa: ${verifiedCount} tố cáo đã xác thực`;
        target.lockedAt = new Date().toISOString();
        writeUsers(users);

        pushNotification(
          target.id, 'locked',
          '🔒 Tài khoản đã bị khóa',
          `Tài khoản của bạn đã bị khóa tự động sau ${verifiedCount} tố cáo được xác thực. Nếu cho rằng đây là oan, hãy gửi khiếu nại.`
        );

        // Thông báo cho tất cả admin
        const admins = readUsers().filter(u => u.role === 'admin');
        admins.forEach(a => {
          pushNotification(
            a.id, 'alert',
            '⚠️ Tự động khóa tài khoản',
            `${target.name} đã bị khóa tự động (${verifiedCount} tố cáo). Vào admin xem xét.`
          );
        });
      } else if (verifiedCount >= REPORT_THRESHOLDS.REVIEW) {
        pushNotification(
          target.id, 'warning',
          '⚠️ Cảnh báo',
          `Bạn đã có ${verifiedCount} tố cáo được xác thực. Nếu còn tiếp tục, tài khoản sẽ bị khóa.`
        );
      }
    }
  }

  // Thông báo cho người tố cáo
  pushNotification(
    report.reporterId, 'report_result',
    status === 'verified' ? '✅ Tố cáo được chấp nhận' : 'Tố cáo bị bỏ qua',
    `Tố cáo của bạn về "${report.reportedName}" đã được xử lý: ${status}.`
  );

  response.json({ message: 'Đã cập nhật.', report });
});

/* ===================== ADMIN — APPEAL MANAGEMENT ===================== */
app.get('/api/admin/appeals', requireAdmin, (request, response) => {
  const data = readReports();
  const appeals = data.appeals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  response.json({ appeals });
});

app.put('/api/admin/appeals/:id', requireAdmin, (request, response) => {
  const status = String(request.body.status || '');
  const adminNote = String(request.body.adminNote || '').trim().slice(0, 500);
  if (!['accepted', 'rejected', 'pending'].includes(status))
    return response.status(400).json({ message: 'Trạng thái không hợp lệ.' });

  const data = readReports();
  const appeal = data.appeals.find(a => a.id === request.params.id);
  if (!appeal) return response.status(404).json({ message: 'Không tìm thấy khiếu nại.' });

  appeal.status = status;
  appeal.adminNote = adminNote;
  appeal.reviewedAt = new Date().toISOString();
  appeal.reviewedBy = request.user.name;
  writeReports(data);

  // Nếu accept → mở khóa tài khoản
  if (status === 'accepted') {
    const users = readUsers();
    const user = users.find(u => u.id === appeal.userId);
    if (user) {
      user.locked = false;
      user.lockReason = null;
      user.lockedAt = null;
      writeUsers(users);
    }
    pushNotification(
      appeal.userId, 'appeal_result',
      '✅ Khiếu nại được chấp nhận',
      `Khiếu nại của bạn đã được chấp nhận. Tài khoản đã được mở khóa.`
    );
  } else if (status === 'rejected') {
    pushNotification(
      appeal.userId, 'appeal_result',
      '❌ Khiếu nại bị từ chối',
      `Khiếu nại của bạn đã bị từ chối.${adminNote ? ' Lý do: ' + adminNote : ''}`
    );
  }

  response.json({ message: 'Đã cập nhật.', appeal });
});

/* ===================== ADMIN — USER LIST (để chọn khi tố cáo) ===================== */
app.get('/api/users/list', requireActive, (request, response) => {
  const users = readUsers()
    .filter(u => u.id !== request.user.id && !u.locked)
    .map(u => ({ id: u.id, name: u.name }));
  response.json({ users });
});

/* ===================== FALLBACK ===================== */
app.get('*', (request, response) => {
  const requested = request.path === '/' ? 'index.html' : request.path.slice(1);
  const fullPath = path.join(root, requested);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return response.sendFile(fullPath);
  }
  response.sendFile(path.join(root, 'index.html'));
});

module.exports = {
  app,
  initializeDataFiles,
  initializeDatabase,
  getSmtpStatus,
  dataDir,
  usersFile,
  reportsFile
};

if (require.main === module) {
  initializeDatabase()
    .then(() => app.listen(port, () => console.log(`Arcade Hub: ${process.env.APP_URL || `http://localhost:${port}`}`)))
    .catch(error => {
      console.error('[startup] Database initialization failed:', error.message);
      process.exit(1);
    });
}