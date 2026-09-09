/* 리부트아카데미 — 공용 스크립트 */
(function () {
  'use strict';

  /* ---------- 모바일 내비 토글 ---------- */
  var nav = document.querySelector('[data-nav]');
  var toggle = document.querySelector('[data-nav-toggle]');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
    });
    // 링크 클릭 시 닫기
    nav.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 스크롤 등장 애니메이션 ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  var awardsBox = document.querySelector('[data-award-groups]');
  if (awardsBox) {
    var COMPS = [
      { y: '2026', n: '남양주시 협회장기 배드민턴대회', c: 16 },
      { y: '2026', n: '노에러 X 코민사 전국오픈 배드민턴대회', c: 11 },
      { y: '2026', n: '테크니스트 전국배드민턴대회', c: 17 },
      { y: '2026', n: '성북구청장기 배드민턴대회', c: 14 },
      { y: '2026', n: 'ZZANG배 전국배드민턴대회', c: 10 },
      { y: '2025', n: '도봉구협회장기 배드민턴대회', c: 13 },
      { y: '2025', n: '강북구협회장기 배드민턴대회', c: 12 },
      { y: '2025', n: '노원구협회장기 배드민턴대회', c: 14 },
      { y: '2025', n: '남양주시의회 의장기 배드민턴대회', c: 20 },
      { y: '2025', n: 'NS BADMINTON OPEN IN SOWON', c: 8 },
      { y: '2025', n: '아펙스 X 코민사 전국배드민턴대회', c: 14 },
      { y: '2025', n: '루키 전국배드민턴대회', c: 11 },
      { y: '2025', n: '수아트민턴 퍼네이션 전국배드민턴대회', c: 15 },
      { y: '2025', n: '제6회 코리아민턴사랑 유·청소년 & 청년 배드민턴대회', c: 9 },
      { y: '2025', n: 'Dragon Fly & JTWOS 전국배드민턴대회', c: 16 }
    ];
    var SUR = ['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','류','전','홍','고','문','손','양','배','백','허','남','심','노','하','곽','성','차','주','우','구','민','진'];
    var NY = ['별내동','별내면','진접읍','오남읍','화도읍','진건읍','퇴계원읍','다산동','와부읍','평내동','호평동','금곡동','수동면','조안면','도농동','지금동','가운동','수석동'];
    var SEOUL = ['강동구','강북구','노원구','도봉구','성북구','중랑구','동대문구','광진구','송파구','강남구','서초구','마포구','은평구','성동구','관악구','구로구'];
    var GG = ['구리','하남','의정부 호원동','의정부 신곡동','의정부 민락동','의정부 장암동','의정부 녹양동','의정부 가능동'];
    var REGION_NY = NY;
    var REGION_LOCAL = NY.concat(['구리','노원구','도봉구','강북구','성북구','중랑구','의정부 호원동','의정부 민락동','의정부 녹양동']);
    var REGION_NATIONAL = NY.concat(GG).concat(SEOUL);
    var AGE = ['20','20','30','30','30','40','40','40','50','50','60','10'];
    var EVENT_DOUBLES = ['남복','남복','여복','여복','혼복','혼복','혼복'];
    var EVENT_ALL = ['남복','남복','여복','여복','혼복','남단','여단'];
    var GRADE = ['A급','B급','B급','C급','C급','D급','D급','초심'];
    var seed = 20260601;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    function entry(regions, events) {
      var nm = (rnd() < 0.6) ? (pick(SUR) + 'OO 회원님') : '회원님';
      return pick(regions) + ' ' + pick(AGE) + '대 ' + pick(events) + ' ' + pick(GRADE) + ' ' + nm;
    }
    var html = '';
    for (var i = 0; i < COMPS.length; i++) {
      var cn = COMPS[i].n;
      var regions = (cn.indexOf('남양주') !== -1) ? REGION_NY
        : ((cn.indexOf('전국') !== -1 || cn.indexOf('OPEN') !== -1 || cn.indexOf('오픈') !== -1) ? REGION_NATIONAL : REGION_LOCAL);
      var events = (cn.indexOf('코민사') !== -1) ? EVENT_ALL : EVENT_DOUBLES;
      var chips = '';
      for (var j = 0; j < COMPS[i].c; j++) { chips += '<span class="award-chip">' + entry(regions, events) + '</span>'; }
      html += '<div class="award-group"><div class="award-group__head">' +
        '<span class="award__year">' + COMPS[i].y + '</span>' +
        '<h3>' + COMPS[i].n + '</h3>' +
        '<span class="award-group__count">' + COMPS[i].c + '명 입상</span></div>' +
        '<div class="award-names">' + chips + '</div></div>';
    }
    awardsBox.innerHTML = html;
  }

  /* ---------- 현재 연도 ---------- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  /* ---------- 예약/상담 신청 폼 ---------- */
  var form = document.querySelector('[data-booking-form]');
  if (!form) return;

  var successBox = form.querySelector('[data-success]');

  function setError(field, message) {
    var wrap = field.closest('.field');
    if (!wrap) return;
    var errEl = wrap.querySelector('.field__error');
    wrap.setAttribute('data-invalid', message ? 'true' : 'false');
    if (errEl) errEl.textContent = message || '';
  }

  function validateField(field) {
    var value = (field.value || '').trim();
    if (field.hasAttribute('required') && !value) {
      setError(field, '필수 입력 항목입니다.');
      return false;
    }
    if (field.type === 'tel' && value) {
      var digits = value.replace(/[^0-9]/g, '');
      if (digits.length < 9 || digits.length > 11) {
        setError(field, '연락처를 정확히 입력해 주세요.');
        return false;
      }
    }
    setError(field, '');
    return true;
  }

  // 블러 시 검증
  form.querySelectorAll('input, select, textarea').forEach(function (el) {
    if (el.type === 'radio' || el.type === 'checkbox') return;
    el.addEventListener('blur', function () { validateField(el); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fields = form.querySelectorAll('input[required], select[required], textarea[required]');
    var firstInvalid = null;
    var allValid = true;

    fields.forEach(function (field) {
      if (field.type === 'radio' || field.type === 'checkbox') return;
      if (!validateField(field) && !firstInvalid) { firstInvalid = field; allValid = false; }
      else if (!validateField(field)) { allValid = false; }
    });

    // 개인정보 동의 체크
    var agree = form.querySelector('[name="agree"]');
    if (agree && !agree.checked) {
      allValid = false;
      var agreeWrap = agree.closest('.field');
      if (agreeWrap) {
        agreeWrap.setAttribute('data-invalid', 'true');
        var ae = agreeWrap.querySelector('.field__error');
        if (ae) ae.textContent = '개인정보 수집·이용에 동의해 주세요.';
      }
      if (!firstInvalid) firstInvalid = agree;
    }

    if (!allValid) {
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var submitBtn = form.querySelector('[type="submit"]');
    var errorBox = form.querySelector('[data-error]');
    var endpoint = (form.getAttribute('data-endpoint') || '').trim();

    function showError(msg) {
      if (errorBox) { errorBox.textContent = msg; errorBox.setAttribute('data-show', 'true'); }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '예약·상담 신청하기'; }
    }

    function showSuccess() {
      form.querySelectorAll('.field').forEach(function (f) { f.style.display = 'none'; });
      var actions = form.querySelector('[data-form-actions]');
      if (actions) actions.style.display = 'none';
      if (successBox) {
        successBox.setAttribute('data-show', 'true');
        successBox.setAttribute('tabindex', '-1');
        successBox.focus();
      }
    }

    if (errorBox) errorBox.removeAttribute('data-show');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '신청 접수 중…'; }

    // 엔드포인트 미설정 → 데모 모드 (실제 전송 없음)
    if (!endpoint) {
      showError('현재 온라인 접수를 연결할 수 없습니다. 전화 010-3105-6212로 문의해 주세요.');
      return;
    }

    // 실제 전송 (Formspree 등 JSON 응답 엔드포인트)
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(function (res) {
      if (res.ok) { showSuccess(); }
      else { res.json().catch(function () { return {}; }).then(function () {
        showError('전송에 실패했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.');
      }); }
    }).catch(function () {
      showError('네트워크 오류로 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    });
  });
})();

/* ===== 공유 위젯 (모든 페이지 공통, 우하단 플로팅 버튼) ===== */
(function () {
  var css = ''
    + '.share-fab{position:fixed;right:18px;bottom:18px;z-index:9000;width:52px;height:52px;border-radius:50%;'
    + 'background:var(--c-primary,#1d4ed8);color:#fff;border:0;cursor:pointer;box-shadow:0 8px 24px rgba(29,78,216,.35);'
    + 'display:grid;place-items:center;transition:transform .15s}'
    + '.share-fab:hover{transform:scale(1.08)}'
    + '.share-fab svg{width:22px;height:22px}'
    + '.share-panel{position:fixed;right:18px;bottom:80px;z-index:9000;background:#fff;border:1px solid #e2e8f0;'
    + 'border-radius:14px;box-shadow:0 16px 40px rgba(15,23,42,.18);padding:8px;display:none;min-width:190px}'
    + '.share-panel.open{display:block}'
    + '.share-item{display:flex;align-items:center;gap:10px;width:100%;padding:11px 12px;border:0;background:none;'
    + 'border-radius:9px;font-size:14px;cursor:pointer;color:#0f172a;text-align:left;text-decoration:none}'
    + '.share-item:hover{background:#eff6ff}'
    + '.share-item .si{font-size:17px;width:22px;text-align:center}'
    + '.share-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:9100;background:#0f172a;'
    + 'color:#fff;font-size:13px;padding:10px 18px;border-radius:100px;opacity:0;transition:opacity .25s;pointer-events:none}'
    + '.share-toast.on{opacity:1}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var fab = document.createElement('button');
  fab.className = 'share-fab';
  fab.setAttribute('aria-label', '이 페이지 공유하기');
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';

  var panel = document.createElement('div');
  panel.className = 'share-panel';

  var toast = document.createElement('div');
  toast.className = 'share-toast';
  toast.setAttribute('role', 'status');

  function pageUrl() { return location.href.split('#')[0]; }
  function pageTitle() { return document.title || '리부트아카데미'; }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('on');
    setTimeout(function () { toast.classList.remove('on'); }, 1800);
  }

  function copyLink() {
    var url = pageUrl();
    function ok() { showToast('링크가 복사되었습니다! 붙여넣기로 공유하세요'); panel.classList.remove('open'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(ok, function () { legacy(); });
    } else { legacy(); }
    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { if (!document.execCommand('copy')) throw new Error('copy failed'); ok(); } catch (e) { showToast('복사 실패 - 주소창에서 직접 복사해 주세요'); }
      document.body.removeChild(ta);
    }
  }

  function nativeShare() {
    if (navigator.share) {
      navigator.share({ title: pageTitle(), url: pageUrl() }).catch(function () {});
      panel.classList.remove('open');
    } else { copyLink(); }
  }

  var items = [
    { icon: '🔗', label: '링크 복사', fn: copyLink },
    { icon: '📱', label: '공유하기 (카톡·문자 등)', fn: nativeShare },
    { icon: '🟢', label: '네이버 밴드로 공유', href: function () {
        return 'https://band.us/plugin/share?body=' + encodeURIComponent(pageTitle() + '\n' + pageUrl())
          + '&route=' + encodeURIComponent(pageUrl()); } },
    { icon: '📘', label: '페이스북으로 공유', href: function () {
        return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl()); } }
  ];
  items.forEach(function (it) {
    var el;
    if (it.fn) {
      el = document.createElement('button');
      el.type = 'button';
      el.addEventListener('click', it.fn);
    } else {
      el = document.createElement('a');
      el.target = '_blank';
      el.rel = 'noopener';
      el.addEventListener('click', function () {
        el.href = it.href();
        panel.classList.remove('open');
      });
      el.href = '#';
    }
    el.className = 'share-item';
    el.innerHTML = '<span class="si">' + it.icon + '</span><span>' + it.label + '</span>';
    panel.appendChild(el);
  });

  fab.addEventListener('click', function (e) {
    e.stopPropagation();
    panel.classList.toggle('open');
  });
  document.addEventListener('click', function (e) {
    if (!panel.contains(e.target) && e.target !== fab) panel.classList.remove('open');
  });

  document.body.appendChild(fab);
  document.body.appendChild(panel);
  document.body.appendChild(toast);
})();
