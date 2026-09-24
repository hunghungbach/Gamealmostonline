const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { initializeDataFiles, getSmtpStatus } = require('../server.js');

test('initializeDataFiles creates data folder and default JSON files', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'arcadehub-'));

  try {
    const result = initializeDataFiles(tempRoot);

    assert.ok(fs.existsSync(result.dataDir));
    assert.ok(fs.existsSync(result.usersFile));
    assert.ok(fs.existsSync(result.reportsFile));

    const users = JSON.parse(fs.readFileSync(result.usersFile, 'utf8'));
    const reports = JSON.parse(fs.readFileSync(result.reportsFile, 'utf8'));

    assert.deepEqual(users, []);
    assert.deepEqual(reports.reports, []);
    assert.deepEqual(reports.appeals, []);
    assert.deepEqual(reports.notifications, []);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('getSmtpStatus rejects placeholder Gmail credentials and accepts real SMTP credentials', () => {
  const placeholder = getSmtpStatus({
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_USER: 'your-email@gmail.com',
    SMTP_PASS: 'your-gmail-app-password'
  });

  const valid = getSmtpStatus({
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_USER: 'real.user@gmail.com',
    SMTP_PASS: 'app-password-123'
  });

  assert.equal(placeholder.enabled, false);
  assert.match(placeholder.message, /App Password|SMTP_USER|SMTP_PASS/i);
  assert.equal(valid.enabled, true);
  assert.equal(valid.host, 'smtp.gmail.com');
});
