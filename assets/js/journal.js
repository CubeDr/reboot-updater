/* =========================================================
   리부트아카데미 — 배드민턴 일지 앱 (카카오 로그인)
   - 회원: 카카오로 로그인 → 본인 일지만 작성/조회/수정/삭제
   - 코치: coaches 테이블에 등록된 계정 → 전체 회원 일지 열람 + 피드백
   접근 권한은 Supabase RLS(서버)가 강제합니다.
   ========================================================= */
(function () {
  'use strict';

  var cfg = window.REBOOT_JOURNAL_CONFIG || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var els = {
    loading: $('#jr-loading'),
    setup: $('#jr-setup'),
    auth: $('#jr-auth'),
    member: $('#jr-member'),
    coach: $('#jr-coach')
  };

  /* ---------- 설정 확인 ---------- */
  function isConfigured() {
    return cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
      cfg.SUPABASE_URL.indexOf('여기에') === -1 &&
      cfg.SUPABASE_ANON_KEY.indexOf('여기에') === -1;
  }
  function show(view) {
    ['loading', 'setup', 'auth', 'member', 'coach'].forEach(function (k) {
      if (els[k]) els[k].hidden = (k !== view);
    });
  }

  if (!window.supabase || !window.supabase.createClient) {
    show('setup');
    if (els.setup) els.setup.querySelector('h1').textContent = '네트워크 오류 — Supabase 라이브러리를 불러오지 못했습니다.';
    return;
  }
  if (!isConfigured()) { show('setup'); return; }

  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  /* ---------- 유틸 ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    var wd = ['일', '월', '화', '수', '목', '금', '토'];
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return (+p[1]) + '월 ' + (+p[2]) + '일 (' + wd[d.getDay()] + ')';
  }
  function dots(n) {
    n = parseInt(n, 10);
    if (!n || n < 1) return '';
    var on = '●●●●●'.slice(0, n);
    var off = '○○○○○'.slice(0, 5 - n);
    return '<span class="jr-dots" title="컨디션 ' + n + '/5">' + on + off + '</span>';
  }
  function userName(u) {
    var m = (u && u.user_metadata) || {};
    return m.name || m.full_name || m.nickname || m.user_name || m.preferred_username || (u && u.email) || '회원';
  }

  /* =========================================================
     로그인 (카카오)
     ========================================================= */
  var kakaoBtn = $('#jr-kakao');
  var authMsg = $('#jr-auth-msg');
  function setAuthMsg(text, type) {
    if (!authMsg) return;
    authMsg.textContent = text || '';
    authMsg.setAttribute('data-type', type || '');
  }
  if (kakaoBtn) kakaoBtn.addEventListener('click', function () {
    kakaoBtn.disabled = true;
    setAuthMsg('카카오로 이동 중…', '');
    var redirectTo = window.location.origin + window.location.pathname;
    sb.auth.signInWithOAuth({
      provider: 'kakao',
      // 닉네임 권한만 요청 (이메일·프로필사진은 비즈앱 필요 → 요청 시 KOE205 오류)
      options: { redirectTo: redirectTo, scopes: 'profile_nickname' }
    }).then(function (res) {
      if (res.error) {
        kakaoBtn.disabled = false;
        setAuthMsg('로그인을 시작하지 못했습니다: ' + res.error.message, 'error');
      }
      // 성공 시 카카오 페이지로 이동 → 돌아오면 onAuthStateChange 처리
    });
  });

  /* =========================================================
     일지 데이터
     ========================================================= */
  var currentUser = null;
  var editingId = null;

  /* ---------- 회원: 작성 카드 ---------- */
  var entryForm = $('#jr-entry');
  var entryMsg = $('#jr-entry-msg');
  var listEl = $('#jr-list');
  var countEl = $('#jr-count');
  var cancelEditBtn = entryForm ? $('[data-cancel-edit]', entryForm) : null;
  var DRAFT_KEY = 'reboot_journal_draft';

  // 컨디션 점수 버튼
  $all('[data-rate]').forEach(function (group) {
    var hidden = group.parentNode.querySelector('input[type="hidden"]');
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var val = b.getAttribute('data-val');
      var already = b.classList.contains('is-on') && hidden.value === val;
      $all('button', group).forEach(function (x) { x.classList.remove('is-on'); });
      if (already) { hidden.value = ''; return; }
      $all('button', group).forEach(function (x) {
        if (parseInt(x.getAttribute('data-val'), 10) <= parseInt(val, 10)) x.classList.add('is-on');
      });
      hidden.value = val;
    });
  });

  // 빠른 추가 칩
  var chipsBox = entryForm ? $('[data-chips]', entryForm) : null;
  if (chipsBox) chipsBox.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var ta = entryForm.practice;
    var word = b.textContent.trim();
    var cur = ta.value.trim();
    if (cur.split(/[,\s·]+/).indexOf(word) !== -1) return;
    ta.value = cur ? (cur + ', ' + word) : word;
    saveDraft();
  });

  function setCondition(val) {
    var group = $('[data-rate="condition"]');
    var hidden = entryForm.condition;
    $all('button', group).forEach(function (x) {
      x.classList.toggle('is-on', val && parseInt(x.getAttribute('data-val'), 10) <= parseInt(val, 10));
    });
    hidden.value = val || '';
  }

  /* 작성 중 임시 저장 */
  function saveDraft() {
    if (editingId) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        entry_date: entryForm.entry_date.value,
        duration_min: entryForm.duration_min.value,
        condition: entryForm.condition.value,
        practice: entryForm.practice.value,
        went_well: entryForm.went_well.value,
        to_improve: entryForm.to_improve.value,
        memo: entryForm.memo.value
      }));
    } catch (e) {}
  }
  function loadDraft() {
    try {
      var d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!d) return;
      if (d.entry_date) entryForm.entry_date.value = d.entry_date;
      entryForm.duration_min.value = d.duration_min || '';
      entryForm.practice.value = d.practice || '';
      entryForm.went_well.value = d.went_well || '';
      entryForm.to_improve.value = d.to_improve || '';
      entryForm.memo.value = d.memo || '';
      if (d.condition) setCondition(d.condition);
    } catch (e) {}
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }

  if (entryForm) {
    $all('input, textarea', entryForm).forEach(function (el) {
      el.addEventListener('input', saveDraft);
    });
  }

  function resetEntryForm() {
    entryForm.reset();
    entryForm.entry_date.value = todayStr();
    setCondition('');
    editingId = null;
    if (cancelEditBtn) cancelEditBtn.hidden = true;
    entryForm.querySelector('[type="submit"]').textContent = '저장하기';
    $('.jr-entry__title').textContent = '오늘의 일지 쓰기';
  }

  if (cancelEditBtn) cancelEditBtn.addEventListener('click', function () {
    resetEntryForm();
    if (entryMsg) entryMsg.textContent = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function startEdit(row) {
    editingId = row.id;
    entryForm.entry_date.value = row.entry_date || todayStr();
    entryForm.duration_min.value = row.duration_min || '';
    entryForm.practice.value = row.practice || '';
    entryForm.went_well.value = row.went_well || '';
    entryForm.to_improve.value = row.to_improve || '';
    entryForm.memo.value = row.memo || '';
    setCondition(row.condition || '');
    if (cancelEditBtn) cancelEditBtn.hidden = false;
    entryForm.querySelector('[type="submit"]').textContent = '수정 저장';
    $('.jr-entry__title').textContent = '일지 수정';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (entryForm) entryForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!currentUser) return;
    var btn = entryForm.querySelector('[type="submit"]');
    var dur = entryForm.duration_min.value;
    var cond = entryForm.condition.value;
    var payload = {
      entry_date: entryForm.entry_date.value || todayStr(),
      duration_min: dur ? parseInt(dur, 10) : null,
      condition: cond ? parseInt(cond, 10) : null,
      practice: entryForm.practice.value.trim() || null,
      went_well: entryForm.went_well.value.trim() || null,
      to_improve: entryForm.to_improve.value.trim() || null,
      memo: entryForm.memo.value.trim() || null
    };
    function setMsg(t, type) { if (entryMsg) { entryMsg.textContent = t; entryMsg.setAttribute('data-type', type || ''); } }
    btn.disabled = true;
    var op;
    if (editingId) {
      op = sb.from('journals').update(payload).eq('id', editingId);
    } else {
      payload.user_id = currentUser.id;
      payload.member_name = userName(currentUser);
      op = sb.from('journals').insert(payload);
    }
    op.then(function (res) {
      btn.disabled = false;
      if (res.error) { setMsg('저장 실패: ' + res.error.message, 'error'); return; }
      setMsg(editingId ? '수정했어요 ✓' : '저장했어요 ✓', 'ok');
      clearDraft();
      resetEntryForm();
      setTimeout(function () { setMsg(''); }, 2500);
      loadMemberEntries();
    });
  });

  /* ---------- 회원: 목록 ---------- */
  function loadMemberEntries() {
    if (!listEl) return;
    sb.from('journals').select('*')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { listEl.innerHTML = '<div class="jr-empty">불러오지 못했습니다: ' + esc(res.error.message) + '</div>'; return; }
        var rows = res.data || [];
        if (countEl) { countEl.hidden = rows.length === 0; countEl.textContent = rows.length + '개'; }
        if (!rows.length) {
          listEl.innerHTML = '<div class="jr-empty">아직 기록이 없어요.<br>위에서 오늘 연습을 첫 일지로 남겨보세요! 🏸</div>';
          return;
        }
        listEl.innerHTML = rows.map(memberCard).join('');
        bindMemberActions(rows);
      });
  }

  function bodyRows(r) {
    var html = '';
    if (r.practice) html += '<div class="jr-row"><b>연습한 것</b><p>' + esc(r.practice) + '</p></div>';
    if (r.went_well) html += '<div class="jr-row"><b>👍 잘된 점</b><p>' + esc(r.went_well) + '</p></div>';
    if (r.to_improve) html += '<div class="jr-row"><b>🔧 보완할 점</b><p>' + esc(r.to_improve) + '</p></div>';
    if (r.memo) html += '<div class="jr-row"><b>메모</b><p>' + esc(r.memo) + '</p></div>';
    return html;
  }

  function memberCard(r) {
    var meta = '';
    if (r.condition) meta += dots(r.condition);
    if (r.duration_min) meta += '<span class="jr-badge">' + r.duration_min + '분</span>';
    var fb = r.coach_feedback
      ? '<div class="jr-feedback"><b>🏸 코치 피드백</b><p>' + esc(r.coach_feedback) + '</p></div>'
      : '';
    return '' +
      '<article class="jr-item" data-id="' + esc(r.id) + '">' +
        '<div class="jr-item__top">' +
          '<span class="jr-item__date">' + esc(fmtDate(r.entry_date)) + '</span>' +
          '<span class="jr-item__meta">' + meta + '</span>' +
        '</div>' +
        '<div class="jr-item__body">' + bodyRows(r) + '</div>' +
        fb +
        '<div class="jr-item__actions">' +
          '<button class="jr-mini" data-edit type="button">수정</button>' +
          '<button class="jr-mini jr-mini--danger" data-del type="button">삭제</button>' +
        '</div>' +
      '</article>';
  }

  function bindMemberActions(rows) {
    var byId = {};
    rows.forEach(function (r) { byId[r.id] = r; });
    $all('.jr-item', listEl).forEach(function (card) {
      var id = card.getAttribute('data-id');
      var editBtn = $('[data-edit]', card);
      var delBtn = $('[data-del]', card);
      if (editBtn) editBtn.addEventListener('click', function () { startEdit(byId[id]); });
      if (delBtn) delBtn.addEventListener('click', function () {
        if (!confirm('이 일지를 삭제할까요?')) return;
        delBtn.disabled = true;
        sb.from('journals').delete().eq('id', id).then(function (res) {
          if (res.error) { alert('삭제 실패: ' + res.error.message); delBtn.disabled = false; return; }
          if (editingId === id) resetEntryForm();
          loadMemberEntries();
        });
      });
    });
  }

  /* =========================================================
     코치 대시보드
     ========================================================= */
  var coachListEl = $('#jr-coach-list');
  var filterEl = $('#jr-filter');
  var refreshBtn = $('[data-refresh]');
  var coachRows = [];

  function loadCoachEntries() {
    if (!coachListEl) return;
    coachListEl.innerHTML = '<div class="jr-center">불러오는 중…</div>';
    sb.from('journals').select('*')
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { coachListEl.innerHTML = '<div class="jr-empty">불러오지 못했습니다: ' + esc(res.error.message) + '</div>'; return; }
        coachRows = res.data || [];
        renderCoachStats();
        renderCoachFilter();
        renderCoachList();
      });
  }

  function renderCoachStats() {
    var members = {};
    var weekCount = 0;
    var weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    coachRows.forEach(function (r) {
      members[r.user_id || r.member_name] = true;
      if (r.created_at && new Date(r.created_at) >= weekAgo) weekCount++;
    });
    $('#jr-st-members').textContent = Object.keys(members).length;
    $('#jr-st-entries').textContent = coachRows.length;
    $('#jr-st-week').textContent = weekCount;
  }

  function renderCoachFilter() {
    if (!filterEl) return;
    var prev = filterEl.value;
    var names = {};
    coachRows.forEach(function (r) {
      var key = r.user_id || r.member_name;
      names[key] = r.member_name || '(이름 없음)';
    });
    var opts = '<option value="">전체 회원</option>';
    Object.keys(names).forEach(function (k) {
      opts += '<option value="' + esc(k) + '">' + esc(names[k]) + '</option>';
    });
    filterEl.innerHTML = opts;
    if (prev) filterEl.value = prev;
  }

  function renderCoachList() {
    var filter = filterEl ? filterEl.value : '';
    var rows = coachRows.filter(function (r) {
      return !filter || (r.user_id || r.member_name) === filter;
    });
    if (!rows.length) {
      coachListEl.innerHTML = '<div class="jr-empty">아직 작성된 일지가 없습니다.</div>';
      return;
    }
    coachListEl.innerHTML = rows.map(coachCard).join('');
    bindCoachActions();
  }

  function coachCard(r) {
    var meta = '';
    if (r.condition) meta += dots(r.condition);
    if (r.duration_min) meta += '<span class="jr-badge">' + r.duration_min + '분</span>';
    return '' +
      '<article class="jr-item" data-id="' + esc(r.id) + '">' +
        '<div class="jr-item__top">' +
          '<span><span class="jr-item__who">' + esc(r.member_name || '회원') + '</span> ' +
            '<span class="jr-item__date" style="font-size:1rem">· ' + esc(fmtDate(r.entry_date)) + '</span></span>' +
          '<span class="jr-item__meta">' + meta + '</span>' +
        '</div>' +
        '<div class="jr-item__body">' + bodyRows(r) + '</div>' +
        '<div class="jr-fb-edit">' +
          '<label class="jr-f__lbl" style="font-size:.85rem">🏸 코치 피드백 (회원에게 보여집니다)</label>' +
          '<textarea data-fb rows="2" placeholder="피드백을 적어주세요">' + esc(r.coach_feedback || '') + '</textarea>' +
          '<div class="jr-fb-row">' +
            '<span class="jr-msg" data-fb-msg></span>' +
            '<button class="btn btn--primary" data-fb-save type="button">피드백 저장</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function bindCoachActions() {
    $all('.jr-item', coachListEl).forEach(function (card) {
      var id = card.getAttribute('data-id');
      var ta = $('[data-fb]', card);
      var saveBtn = $('[data-fb-save]', card);
      var msg = $('[data-fb-msg]', card);
      if (saveBtn) saveBtn.addEventListener('click', function () {
        saveBtn.disabled = true;
        if (msg) { msg.textContent = '저장 중…'; msg.setAttribute('data-type', ''); }
        sb.from('journals').update({ coach_feedback: ta.value.trim() || null }).eq('id', id).then(function (res) {
          saveBtn.disabled = false;
          if (res.error) { if (msg) { msg.textContent = '실패: ' + res.error.message; msg.setAttribute('data-type', 'error'); } return; }
          if (msg) { msg.textContent = '저장됨 ✓'; msg.setAttribute('data-type', 'ok'); }
          var local = coachRows.filter(function (x) { return x.id === id; })[0];
          if (local) local.coach_feedback = ta.value.trim() || null;
          setTimeout(function () { if (msg) msg.textContent = ''; }, 2500);
        });
      });
    });
  }

  if (filterEl) filterEl.addEventListener('change', renderCoachList);
  if (refreshBtn) refreshBtn.addEventListener('click', loadCoachEntries);

  /* =========================================================
     로그아웃
     ========================================================= */
  $all('[data-logout]').forEach(function (b) {
    b.addEventListener('click', function () { sb.auth.signOut(); });
  });

  /* =========================================================
     인증 상태 → 화면 전환
     ========================================================= */
  function enter(user) {
    currentUser = user;
    show('loading');
    // 코치 여부는 서버 함수(is_coach)로 확인
    sb.rpc('is_coach').then(function (res) {
      var isCoach = !res.error && res.data === true;
      if (isCoach) {
        show('coach');
        loadCoachEntries();
      } else {
        show('member');
        var hello = $('#jr-hello');
        if (hello) hello.textContent = userName(user) + ' 님, 안녕하세요 👋';
        resetEntryForm();
        loadDraft();
        loadMemberEntries();
      }
    });
  }

  function leave() {
    currentUser = null;
    show('auth');
    if (kakaoBtn) kakaoBtn.disabled = false;
    setAuthMsg('');
  }

  // OAuth 리다이렉트로 돌아오는 중이면 로그인 화면을 잠깐 보여주지 않음
  var returningFromOAuth = /[?&]code=/.test(window.location.search) ||
    /access_token=|error=/.test(window.location.hash);

  sb.auth.getSession().then(function (res) {
    var session = res.data && res.data.session;
    if (session && session.user) { if (!currentUser) enter(session.user); }
    else if (!currentUser && !returningFromOAuth) leave();
  });

  sb.auth.onAuthStateChange(function (event, session) {
    if (session && session.user) {
      if (!currentUser || currentUser.id !== session.user.id) enter(session.user);
    } else {
      if (currentUser || event === 'SIGNED_OUT') leave();
    }
  });

})();
