const miniGames = [
  { title: 'Reflex Challenge', category: 'Hành động', rating: 'Hub', tag: 'HOT', image: 'https://api.dicebear.com/7.x/shapes/svg?seed=reflex&backgroundColor=d9f36a,ff5c35', playUrl: '' },
  { title: 'Memory Match', category: 'Puzzle', rating: 'Hub', tag: 'NEW', image: 'https://api.dicebear.com/7.x/shapes/svg?seed=memory&backgroundColor=ff5c35,171717', playUrl: '' },
  { title: 'Snake Classic', category: 'Hành động', rating: 'Hub', tag: 'TOP', image: 'https://api.dicebear.com/7.x/shapes/svg?seed=snake&backgroundColor=171717,d9f36a', playUrl: '' }
];

const madKidSlugs = [
  'stick-war-legacy', 'subway-surfers', 'toca-boca-life-city', 'angry-birds-2', 'bad-piggies',
  'toca-boca-life-vacation', 'offroad-outlaws', 'bus-simulator-ultimate', 'hot-wheels-race-off',
  'bowmasters-archery-shooting', 'toca-boca-life-neighborhood', 'toca-boca-life-office',
  'airplane-flight-simulator-evo', 'pepi-house-happy-family', 'toca-boca-life-hospital',
  'toca-boca-life-school', 'free-kick-football-3d-soccer', 'purble-place', 'toca-boca-life-farm',
  'pepi-hospital-learn-and-care', 'toca-boca-life-town', 'toca-boca-life-after-school',
  'pepi-wonder-world-magic-isle', 'pepi-super-stores-fun-games', 'subway-princess-runner',
  'world-cricket-championship-lte', 'world-cricket-championship-wcc-lite', 'my-town-school',
  'toca-boca-life-pets', 'my-town-home-family-playhouse', 'toca-boca-life-stable',
  'flat-zombies-defense-and-cleanup', 'street-racing-3d', 'toca-boca-life-town-new',
  'racing-in-car-2', 'ultimate-car-driving-simulator', 'my-town-preschool-kids-game',
  'dr-panda-town-tales', 'coach-bus-simulator', 'mountain-bike-xtreme', 'driving-school-2016',
  'shadow-fight-2', 'racing-limits', 'mmx-hill-dash', 'banana-kong', 'my-town-hospital-doctor-game',
  'driving-school-2017', 'central-hospital-stories', 'evil-nun-horror-at-school',
  'my-town-beauty-contest', 'cat-runner-decorate-home', 'survivor-io', 'farm-simulator-evo',
  'idle-miner-tycoon-gold-games', 'my-town-daycare-game', 'demolition-derby-2',
  'food-fighter-clicker-games', 'sweet-home-stories', 'truckers-of-europe-2', 'vacation-hotel-stories'
];

const madKidPuzzleSlugs = [
  'catjong-purrfect-empire', 'cake-sort-3d-color-puzzle', 'cat-slide-tiles', 'happy-glass',
  'crush-the-castle-siege-master', 'vacation-paradise-alaska-hidden-object-fun',
  'sweet-home-look-and-find-2-hidden-object-fun', 'lots-of-things-hidden-object',
  'octomaze-logic-puzzle-game', 'rune-lord-match-3-puzzle-game'
];

const madKidActionSlugs = [
  'five-nights-at-freddys', 'street-fighter-ii', 'ball-blast-cannon-blitz-mania',
  'johnny-trigger-action-shooter', 'aliens-drive-me-crazy'
];

const madKidExtraPuzzleSlugs = [
  'brain-it-on-physics-puzzles', 'brain-on-dot-physics', 'screw-puzzle-3d-brain-teaser',
  'brain-it-on-the-truck', 'machinery-physics-puzzle', '2-for-2-connect-the-numbers',
  '1010-block-puzzle-game'
];

const madKidRacingSlugs = ['traffic-racer', 'monster-truck-go-racing-games'];

const madKidSimulatorSlugs = [
  'city-island-3-sim-builder', 'city-island-5-building-sim', 'idle-guy-life-simulator',
  'bridge-builder-adventure', 'truck-simulator-offroad-2', 'truck-simulator-offroad-4',
  'pov-car-driving', 'speed-legends-car-driving-simulator', 'ultimate-car-driving-classics',
  'drag-sim-2018', 'driving-school-classics', 'taxi-sim-2016', 'bus-simulator-pro-2',
  'truckers-of-europe', 'construction-city-2', 'ship-simulator-19'
];

const madKidCookingSlugs = [
  'kitchen-craze-restaurant-game', 'delicious-the-first-course', 'merge-cake-merge-cooking',
  'undercover-secret-management', 'baking-bread-cooking-game', 'delicious-cooking-and-romance',
  'delicious-mansion-mystery', 'claires-cruisin-cafe-fest-frenzy', 'claires-cafe-tasty-cuisine',
  'claires-cafe-sea-adventure', 'cooking-love-chef-restaurant', 'ranmen-master-ramen-cooking-game',
  'farming-fever-3', 'farming-fever-2', 'farming-fever', 'idle-coffee-shop-3d'
];

const madKidPuzzleSet = new Set([...madKidPuzzleSlugs, ...madKidExtraPuzzleSlugs]);
const madKidAdditionalSlugs = [
  ...madKidActionSlugs, ...madKidExtraPuzzleSlugs, ...madKidRacingSlugs,
  ...madKidSimulatorSlugs, ...madKidCookingSlugs
];

const madKidGames = [...madKidSlugs, ...madKidPuzzleSlugs, ...madKidAdditionalSlugs]
  .filter((slug, index, slugs) => slugs.indexOf(slug) === index)
  .map(slug => {
  const title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const category = madKidCookingSlugs.includes(slug)
    ? 'Cooking'
    : madKidSimulatorSlugs.includes(slug)
      ? 'Simulator'
      : madKidRacingSlugs.includes(slug)
        ? 'Đua xe'
        : madKidActionSlugs.includes(slug)
          ? 'Hành động'
          : madKidPuzzleSet.has(slug) || /purble|geometry-dash|cut-the-rope|puzzle|bad-piggies|idle-miner/.test(slug)
    ? 'Puzzle'
    : /racing|driving|car|bus|bike|truck|offroad|hot-wheels|airplane|subway|derby|mmx/.test(slug)
    ? 'Đua xe'
    : /toca|pepi|my-town|dr-panda|hospital|school|farm|home|hotel|vacation|pets|cat-runner/.test(slug)
      ? 'Phiêu lưu'
      : 'Hành động';
    return {
    title,
    category,
    rating: 'MKG',
    tag: 'MKG',
    image: `https://www.madkidgames.com/games/${slug}/thumb_1.jpg`,
    playUrl: `https://www.madkidgames.com/games/${slug}/index.html`,
    sourceUrl: `https://www.madkidgames.com/game/${slug}`
    };
  });

const games = [
  ...miniGames,
  ...madKidGames
];

const grid = document.querySelector('#gamesGrid');
const emptyState = document.querySelector('#emptyState');
const rows = document.querySelector('#gameRows');
const allGamesView = document.querySelector('#allGamesView');
const recentGrid = document.querySelector('#recentGamesGrid');
const recentEmpty = document.querySelector('#recentEmpty');
const recentNext = document.querySelector('#recentNext');
const recentCount = document.querySelector('#recentCount');
let authMode = 'login';
let pendingEmail = '';
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

async function enforceActiveAccount() {
  const token = localStorage.getItem('arcadeToken');
  const cachedUser = JSON.parse(localStorage.getItem('arcadeUser') || 'null');
  if (!token) return;
  if (cachedUser?.locked) {
    location.replace('appeal.html');
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.status === 403 && result.locked) {
      localStorage.setItem('arcadeUser', JSON.stringify({ ...(cachedUser || {}), locked: true, lockReason: result.lockReason }));
      location.replace('appeal.html');
    }
  } catch (error) {
    // Keep the page usable when the server is temporarily unavailable.
  }
}

enforceActiveAccount();

function gameCardMarkup(game) {
  return `
    <article class="game-card" data-game="${encodeURIComponent(game.title)}" data-url="${game.playUrl || ''}" data-source="${game.sourceUrl || ''}">
      <div class="game-cover">
        ${game.tag ? `<span class="game-badge">${game.tag}</span>` : ''}
        <img src="${game.image}" alt="${game.title}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#d9f36a,#ff5c35)';this.parentElement.innerHTML+='<span style=\'position:absolute;inset:0;display:grid;place-items:center;font-size:48px;z-index:1\'>🎮</span>'">
        <span class="game-play">▶</span>
      </div>
      <div class="game-info">
        <div><h3>${game.title}</h3><p>${game.category}${game.sourceUrl ? ' · MadKidGames' : ' · Mini'}</p></div>
        <span class="game-rating">★ ${game.rating}</span>
      </div>
    </article>`;
}

function bindGameCards(container) {
  container.querySelectorAll('.game-card').forEach(card => card.addEventListener('click', () => {
    const selectedGame = games.find(game => game.title === decodeURIComponent(card.dataset.game));
    if (selectedGame) saveRecentGame(selectedGame);
    const url = card.dataset.url ? `&url=${encodeURIComponent(card.dataset.url)}${card.dataset.source ? `&source=${encodeURIComponent(card.dataset.source)}` : ''}` : '';
    window.location.href = `game.html?game=${card.dataset.game}${url}`;
  }));
}

function saveRecentGame(game) {
  const recent = JSON.parse(localStorage.getItem('arcadeRecentGames') || '[]');
  const next = [game, ...recent.filter(item => item.title !== game.title)].slice(0, 15);
  localStorage.setItem('arcadeRecentGames', JSON.stringify(next));
}

function renderRecentGames() {
  const recent = JSON.parse(localStorage.getItem('arcadeRecentGames') || '[]');
  recentGrid.innerHTML = recent.map(gameCardMarkup).join('');
  if (recentCount) recentCount.classList.add('hidden');
  if (recentNext) recentNext.classList.toggle('hidden', recent.length <= 4);
  recentEmpty.classList.toggle('hidden', recent.length > 0);
  bindGameCards(recentGrid);
}

recentNext?.addEventListener('click', () => {
  recentGrid.scrollBy({ left: recentGrid.clientWidth + 18, behavior: 'smooth' });
});

function renderHomeRows() {
  const sections = [
    { title: 'Thịnh hành', eyebrow: 'ĐANG ĐƯỢC CHƠI NHIỀU', games: games.filter(game => game.sourceUrl).slice(0, 4) },
    { title: 'Hành động', eyebrow: 'NHỊP ĐỘ CAO', games: games.filter(game => game.category === 'Hành động').slice(0, 4) },
    { title: 'Puzzle', eyebrow: 'GIẢI ĐỐ VUI', games: games.filter(game => game.category === 'Puzzle').slice(0, 4) },
    { title: 'Đua xe', eyebrow: 'TỐC ĐỘ BỨT PHÁ', games: games.filter(game => game.category === 'Đua xe').slice(0, 4) },
    { title: 'Simulator', eyebrow: 'MÔ PHỎNG THỰC TẾ', games: games.filter(game => game.category === 'Simulator').slice(0, 4) },
    { title: 'Cooking', eyebrow: 'BẾP NHỎ VUI VẺ', games: games.filter(game => game.category === 'Cooking').slice(0, 4) },
    { title: 'Phiêu lưu', eyebrow: 'KHÁM PHÁ THẾ GIỚI', games: games.filter(game => game.category === 'Phiêu lưu').slice(0, 4) }
  ];
  rows.innerHTML = sections.map(section => `
    <section class="game-row">
      <div class="row-heading"><div><p class="eyebrow">${section.eyebrow}</p><h3>${section.title}</h3></div><button class="row-more" data-category="${section.title}">Xem thêm <span>→</span></button></div>
      <div class="games-grid">${section.games.map(gameCardMarkup).join('')}</div>
    </section>`).join('');
  bindGameCards(rows);
  rows.querySelectorAll('.row-more').forEach(button => button.addEventListener('click', () => showAllGamesView(button.dataset.category)));
}

function renderAllGames(category = '') {
  const term = document.querySelector('#gameSearch').value.toLowerCase().trim();
  const filtered = games.filter(game => (!category || game.category === category) && game.title.toLowerCase().includes(term));
  grid.innerHTML = filtered.map(gameCardMarkup).join('');
  emptyState.classList.toggle('hidden', filtered.length > 0);
  bindGameCards(grid);
}

function showAllGamesView(category = '') {
  rows.classList.add('hidden');
  allGamesView.classList.remove('hidden');
  renderAllGames(category);
  document.querySelector('#games').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderLeaderboard() {
  const list = document.querySelector('#leaderboardList');
  const totals = JSON.parse(localStorage.getItem('arcadeLeaderboard') || '[]')
    .filter(entry => Number(entry.durationSeconds) > 0)
    .reduce((players, entry) => {
      const current = players.get(entry.name) || { name: entry.name, durationSeconds: 0, game: entry.game };
      current.durationSeconds += Number(entry.durationSeconds);
      current.game = entry.game;
      players.set(entry.name, current);
      return players;
    }, new Map());
  const scores = [...totals.values()].sort((a, b) => b.durationSeconds - a.durationSeconds).slice(0, 5);
  const rankTitles = [
    'King of Game',
    'Người sống tình cảm',
    'Vua nhịp tim',
    'Bậc thầy màn hình',
    'Game addict'
  ];

  list.innerHTML = scores.length ? scores.map((entry, index) => {
    const title = rankTitles[index] || 'Game addict';
    const totalMinutes = Math.floor(entry.durationSeconds / 60);
    const displayTime = totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)} giờ ${totalMinutes % 60} phút`
      : totalMinutes > 0 ? `${totalMinutes} phút` : `${entry.durationSeconds} giây`;
    return `
      <div class="leader-row">
        <strong class="rank rank-${index + 1}">${String(index + 1).padStart(2, '0')}</strong>
        <span class="leader-avatar">${entry.name.charAt(0).toUpperCase()}</span>
        <span class="leader-name">${entry.name}<small>${title}</small></span>
        <b>${displayTime}<small>Tổng thời gian</small></b>
      </div>`;
  }).join('') : '<div class="leader-empty">Chưa có ai chạm bảng vàng. Hãy mở game và ghi tên lên đỉnh!</div>';
}

renderHomeRows();
renderAllGames();
document.querySelector('#games').before(document.querySelector('#recentGames'));
renderRecentGames();
renderLeaderboard();

document.querySelector('#gameSearch').addEventListener('input', event => {
  if (event.target.value.trim()) showAllGamesView();
  else { allGamesView.classList.add('hidden'); rows.classList.remove('hidden'); }
  renderAllGames();
});
document.querySelectorAll('.category-popup a').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const category = link.dataset.category;
  if (category === 'Thịnh hành') {
    allGamesView.classList.add('hidden');
    rows.classList.remove('hidden');
    rows.querySelector('.game-row')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    showAllGamesView(category);
  }
}));
document.querySelector('#searchToggle').addEventListener('click', () => {
  const searchToggle = document.querySelector('#searchToggle');
  searchToggle.setAttribute('aria-expanded', 'true');
  document.querySelector('#gameSearch').focus();
});
document.querySelector('#showAllGames').addEventListener('click', () => showAllGamesView());
document.querySelector('#backToRows').addEventListener('click', () => {
  allGamesView.classList.add('hidden');
  rows.classList.remove('hidden');
  document.querySelector('#gameSearch').value = '';
});
document.querySelector('#randomGame').addEventListener('click', () => {
  const game = games[Math.floor(Math.random() * games.length)];
  const url = game.playUrl ? `&url=${encodeURIComponent(game.playUrl)}${game.sourceUrl ? `&source=${encodeURIComponent(game.sourceUrl)}` : ''}` : '';
  window.location.href = `game.html?game=${encodeURIComponent(game.title)}${url}`;
});

function openInfo(title, body) {
  document.querySelector('#infoTitle').textContent = title;
  document.querySelector('#infoBody').innerHTML = body;
  document.querySelector('#infoBackdrop').classList.remove('hidden');
}
document.querySelector('#helpOpen').addEventListener('click', () => openInfo('Trợ giúp', '<p>Chọn game để mở trang chơi. Game mini (Reflex, Memory, Snake) chơi trực tiếp trên web. Các game MadKidGames được nhúng từ thư viện HTML5 chính thức.</p><p>Nếu bạn có thắc mắc, gặp lỗi hoặc cần hỗ trợ, hãy liên hệ admin qua email <a href="mailto:admin@arcadehub.local">admin@arcadehub.local</a>.</p>'));
document.querySelector('#termsOpen').addEventListener('click', () => openInfo('Điều khoản', '<p>Arcade Hub chỉ nhúng các game được MadKidGames cung cấp trong danh mục Embeddable HTML5 Games.</p><p>Hãy tuân thủ điều khoản, quảng cáo và bản quyền của MadKidGames khi chơi.</p>'));
document.querySelector('#infoClose').addEventListener('click', () => document.querySelector('#infoBackdrop').classList.add('hidden'));
document.querySelector('#infoBackdrop').addEventListener('click', event => { if (event.target.id === 'infoBackdrop') event.currentTarget.classList.add('hidden'); });

const backdrop = document.querySelector('#modalBackdrop');
const openModal = mode => { setAuthMode(mode); backdrop.classList.remove('hidden'); };
const closeModal = () => backdrop.classList.add('hidden');
document.querySelector('#loginOpen').addEventListener('click', () => openModal('login'));
const joinOpenButton = document.querySelector('#joinOpen');
if (joinOpenButton) joinOpenButton.addEventListener('click', () => openModal('register'));
document.querySelector('#modalClose').addEventListener('click', closeModal);
backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModal(); });
document.querySelector('#switchAuth').addEventListener('click', event => {
  event.preventDefault();
  setAuthMode(authMode === 'login' ? 'register' : 'login');
});

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === 'register';
  document.querySelector('#authTitle').innerHTML = isRegister ? 'Tạo tài khoản<br><em>mới.</em>' : 'Chào mừng<br><em>trở lại.</em>';
  document.querySelector('#authSubtitle').textContent = isRegister ? 'Tạo hồ sơ để lưu điểm số và thành tích của bạn.' : 'Đăng nhập để lưu thành tích và tiếp tục cuộc chơi.';
  document.querySelector('#name').required = isRegister;
  document.querySelector('#nameField').classList.toggle('hidden', !isRegister);
  document.querySelector('#authSubmit').innerHTML = isRegister ? 'Tạo tài khoản <span>→</span>' : 'Đăng nhập <span>→</span>';
  document.querySelector('#switchPrompt').textContent = isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?';
  document.querySelector('#switchAuth').textContent = isRegister ? 'Đăng nhập' : 'Tạo tài khoản';
  document.querySelector('#credentialsStep').classList.remove('hidden');
  document.querySelector('#verifyStep').classList.add('hidden');
}

document.querySelector('#authForm').addEventListener('submit', event => { event.preventDefault(); submitAuth(); });

async function submitAuth() {
  const email = document.querySelector('#email').value.toLowerCase().trim();
  const password = document.querySelector('#password').value;
  const payload = authMode === 'register' ? { name: document.querySelector('#name').value.trim(), email, password } : { email, password };
  try {
    const response = await fetch(`${API_BASE}/api/auth/${authMode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { showToast(result.message || 'Không thể xác thực.'); return; }
    if (authMode === 'register') {
      pendingEmail = email;
      document.querySelector('#credentialsStep').classList.add('hidden');
      document.querySelector('#verifyStep').classList.remove('hidden');
      showToast(result.message);
    } else { saveSession(result); closeModal(); showToast(`Chào mừng ${result.user.name} trở lại!`); }
  } catch (error) { showToast('Không kết nối được máy chủ. Hãy chạy npm start.'); }
}

document.querySelector('#verifySubmit').addEventListener('click', async () => {
  const code = document.querySelector('#otp').value.trim();
  try {
    const response = await fetch(`${API_BASE}/api/auth/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: pendingEmail, code }) });
    const result = await response.json();
    if (!response.ok) { showToast(result.message || 'Mã xác nhận không đúng.'); return; }
    saveSession(result); closeModal(); showToast(`Xác minh thành công. Chào ${result.user.name}!`);
  } catch (error) { showToast('Không kết nối được máy chủ.'); }
});

document.querySelector('#resendOtp').addEventListener('click', async () => {
  const response = await fetch(`${API_BASE}/api/auth/resend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: pendingEmail }) });
  const result = await response.json();
  showToast(result.message);
});

function saveSession(result) {
  localStorage.setItem('arcadeToken', result.token);
  localStorage.setItem('arcadeUser', JSON.stringify(result.user));

  closeModal();
  updateProfile();

  if (result.user.locked) {
    showToast(`🔒 Tài khoản bị khóa. Đang chuyển đến trang khiếu nại...`);
    setTimeout(() => location.href = 'appeal.html', 1500);
    return;
  }

  showToast(`Chào mừng ${result.user.name} trở lại!`);
}
function updateProfile() {
  const user = JSON.parse(localStorage.getItem('arcadeUser') || 'null');
  document.querySelector('#loginOpen').classList.toggle('hidden', Boolean(user));
  document.querySelector('#profile').classList.toggle('hidden', !user);
  const joinBanner = document.querySelector('.join-banner');
  if (joinBanner) joinBanner.classList.toggle('hidden', Boolean(user));
  if (user) {
    document.querySelector('#avatar').textContent = user.name.charAt(0).toUpperCase();
    document.querySelector('#profileMenu').innerHTML = `${user.name} <span>⌄</span>`;
    document.querySelector('#adminLink').classList.toggle('hidden', user.role !== 'admin');
  }
}

document.querySelector('#logout').addEventListener('click', async () => {
  await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('arcadeToken') || ''}` } });
  localStorage.removeItem('arcadeToken');
  localStorage.removeItem('arcadeUser');
  updateProfile();
  showToast('Bạn đã đăng xuất.');
});

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

updateProfile();
if (location.hash === '#login') openModal('login');
/* ===== PROFILE DROPDOWN ===== */
const profileMenu = document.querySelector('#profileMenu');
const profileDropdown = document.querySelector('#profileDropdown');
if (profileMenu) {
  profileMenu.addEventListener('click', e => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => profileDropdown.classList.add('hidden'));
}

/* ===== QUÊN MẬT KHẨU ===== */
const forgotBackdrop = document.querySelector('#forgotBackdrop');
document.querySelector('#forgotOpen').addEventListener('click', () => {
  forgotBackdrop.classList.remove('hidden');
  document.querySelector('#forgotStep1').classList.remove('hidden');
  document.querySelector('#forgotStep2').classList.add('hidden');
});
document.querySelector('#forgotClose').addEventListener('click', () => forgotBackdrop.classList.add('hidden'));
forgotBackdrop.addEventListener('click', e => { if (e.target === forgotBackdrop) forgotBackdrop.classList.add('hidden'); });

document.querySelector('#forgotSend').addEventListener('click', async () => {
  const email = document.querySelector('#forgotEmail').value.toLowerCase().trim();
  if (!email) return showToast('Vui lòng nhập email.');
  try {
    const r = await fetch(`${API_BASE}/api/auth/forgot`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const d = await r.json();
    showToast(d.message);
    document.querySelector('#forgotStep1').classList.add('hidden');
    document.querySelector('#forgotStep2').classList.remove('hidden');
  } catch (e) { showToast('Không kết nối được máy chủ.'); }
});

document.querySelector('#forgotReset').addEventListener('click', async () => {
  const email = document.querySelector('#forgotEmail').value.toLowerCase().trim();
  const code = document.querySelector('#forgotCode').value.trim();
  const password = document.querySelector('#forgotNewPass').value;
  try {
    const r = await fetch(`${API_BASE}/api/auth/reset`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password })
    });
    const d = await r.json();
    if (!r.ok) return showToast(d.message || 'Lỗi.');
    showToast('Đặt lại thành công. Đăng nhập lại nhé!');
    forgotBackdrop.classList.add('hidden');
  } catch (e) { showToast('Không kết nối được máy chủ.'); }
});
/* ===== NOTIFICATIONS ===== */
async function loadNotifications() {
  const user = JSON.parse(localStorage.getItem('arcadeUser') || 'null');
  if (!user) { document.querySelector('#notifBell')?.classList.add('hidden'); return; }
  document.querySelector('#notifBell')?.classList.remove('hidden');
  try {
    const r = await fetch(`${API_BASE}/api/notifications`, { headers: { Authorization: `Bearer ${localStorage.getItem('arcadeToken')}` } });
    if (!r.ok) return;
    const d = await r.json();
    const badge = document.querySelector('#notifBadge');
    badge.textContent = d.unread || '';
    const list = document.querySelector('#notifList');
    list.innerHTML = d.notifications.length
      ? d.notifications.map(n => `
          <div class="notif-item ${n.read ? '' : 'unread'}">
            <strong>${n.title}</strong>
            <div>${n.body}</div>
            <div class="date">${new Date(n.createdAt).toLocaleString('vi-VN')}</div>
          </div>`).join('')
      : '<div class="notif-item empty">Chưa có thông báo nào.</div>';
  } catch (e) { /* ignore */ }
}

document.querySelector('#notifToggle')?.addEventListener('click', e => {
  e.stopPropagation();
  document.querySelector('#notifDropdown').classList.toggle('hidden');
});
document.addEventListener('click', () => document.querySelector('#notifDropdown')?.classList.add('hidden'));
document.querySelector('#notifReadAll')?.addEventListener('click', async () => {
  await fetch(`${API_BASE}/api/notifications/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${localStorage.getItem('arcadeToken')}` }
  });
  loadNotifications();
});

// Gọi lần đầu + mỗi 30s
setTimeout(loadNotifications, 1000);
setInterval(loadNotifications, 30000);