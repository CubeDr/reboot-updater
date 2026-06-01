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

  /* ---------- 후기 마퀴: 길이 제각각으로 생성 + 끊김 없는 루프 ---------- */
  var mTrack = document.querySelector('[data-marquee-track]');
  if (mTrack) {
    var REVIEWS = [
      { t: "체험 한 번 받고 그 자리에서 바로 등록했어요.", n: "김○○ 님", b: "오남점" },
      { t: "다른 아카데미를 반년이나 다녔는데도 늘 제자리였어요. 여기 오니 첫날부터 뭐가 문제였는지 바로 알겠더라고요. 진작 올걸 그랬습니다.", n: "이○○ 님", b: "별내점" },
      { t: "클럽 레슨만 받다 왔는데, 아 이게 진짜 레슨이구나 싶었어요.", n: "정○○ 님", b: "오남점" },
      { t: "영상으로 제 폼을 보니 한 번에 이해됐어요.", n: "최○○ 님", b: "별내점" },
      { t: "'더 세게'라는 말만 듣다가, 여기선 힘 빼는 순서를 잡아주시는데 신기하게 셔틀이 더 멀리 나가요. 왜 그런지까지 설명해주셔서 혼자 연습할 때도 도움이 됩니다.", n: "강○○ 님", b: "오남점" },
      { t: "라켓 처음 잡아봤는데 첫날 하이클리어를 넘겼어요. 너무 재밌습니다.", n: "윤○○ 님", b: "별내점" },
      { t: "1:1이라 눈치 안 보여서 좋아요.", n: "임○○ 님", b: "오남점" },
      { t: "구력 5년인데 굳은 습관 하나 잡으니 게임이 풀리기 시작했어요.", n: "한○○ 님", b: "별내점" },
      { t: "동호회에서 늘 D조였는데 6개월 만에 C조로 승급했어요. 무작정 많이 치는 게 아니라 약점을 콕 집어 고쳐주신 덕분입니다. 다음 목표는 B조예요.", n: "오○○ 님", b: "오남점" },
      { t: "전용 구장이라 쾌적하고, 수업에만 온전히 집중할 수 있어요.", n: "서○○ 님", b: "별내점" },
      { t: "안트로크 영상 보고 왔는데 직접이 훨씬 낫네요.", n: "신○○ 님", b: "오남점" },
      { t: "90분이 짧게 느껴질 만큼 알차요. 끝나면 땀이 제대로 납니다.", n: "권○○ 님", b: "별내점" },
      { t: "아이 둘 다 여기 보내고 있어요. 자세부터 차근차근 잡아주시고, 무엇보다 아이가 운동을 즐거워해서 좋습니다. 눈높이에 맞춰 봐주셔서 믿고 맡기고 있어요.", n: "황○○ 님", b: "오남점" },
      { t: "다른 데선 '많이 치세요'가 끝이었는데, 여기선 이유를 다 설명해줘요.", n: "안○○ 님", b: "별내점" },
      { t: "체험만 받았는데 그날 폼이 달라졌어요.", n: "송○○ 님", b: "오남점" },
      { t: "직장 끝나고 저녁반에 다니는데 시간표가 잘 맞아서 거의 안 빠지게 돼요. 스트레스도 풀리고 실력도 늘고, 요즘 일주일 중 제일 기다려지는 시간입니다.", n: "류○○ 님", b: "별내점" },
      { t: "스윙이 커서 늘 한 박자 늦었는데, 직선으로 줄이니 리시브가 빨라졌어요.", n: "배○○ 님", b: "오남점" },
      { t: "친구랑 2인 쿠폰으로 같이 배워요. 가성비 최고예요.", n: "문○○ 님", b: "오남점" },
      { t: "어느 코치님께 배워도 기준이 같아서 헷갈리지 않아요.", n: "조○○ 님", b: "별내점" },
      { t: "운동 다시 시작하면서 등록했는데 살도 빠지고 실력도 늘어 일석이조예요. 무엇보다 제대로 배우고 있다는 느낌이 들어서 만족스럽습니다. 주변에도 추천하고 있어요.", n: "남○○ 님", b: "별내점" }
    ];
    var STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 17.8 5.4 21.2 6.7 14.2 1.7 9.4l7-.9z"/></svg>';
    var stars = '<div class="stars">' + STAR + STAR + STAR + STAR + STAR + '</div>';
    var rh = '';
    for (var r = 0; r < REVIEWS.length; r++) {
      rh += '<figure class="quote-card">' + stars +
        '<blockquote>' + REVIEWS[r].t + '</blockquote>' +
        '<figcaption><b>' + REVIEWS[r].n + '</b><span>' + REVIEWS[r].b + '</span></figcaption></figure>';
    }
    mTrack.innerHTML = rh + rh; /* 복제로 끊김 없는 루프 */
  }

  /* ---------- 대회 입상: 회원 명단 자동 생성 (이름 마스킹) ---------- */
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
      setTimeout(showSuccess, 700);
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
