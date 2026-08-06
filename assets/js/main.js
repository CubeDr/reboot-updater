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
      { t: "솔직히 반신반의했어요. 근데 체험 첫날 끝나기도 전에 등록했습니다.", n: "김○○ 님", b: "오남점" },
      { t: "라켓 3년 잡고도 D조를 못 벗어났는데, 여기 3개월 다니고 C조 올라갔어요. 헛친 시간이 아까울 정도입니다. 진작 올걸 그랬어요.", n: "이○○ 님", b: "별내점" },
      { t: "유튜브 보고 '에이 설마' 했는데, 직접 배워보니 진짜였어요.", n: "정○○ 님", b: "오남점" },
      { t: "첫 레슨 끝나고 집 가는 길에 바로 등록 문자 보냈어요.", n: "최○○ 님", b: "별내점" },
      { t: "다른 아카데미 두 곳 다녀봤는데 늘 '많이 치세요'가 끝이었어요. 여기선 왜 안 되는지 영상으로 딱 짚어주는데, 솔직히 충격이었습니다. 차원이 달라요.", n: "강○○ 님", b: "오남점" },
      { t: "스매시가 늘 네트에 걸렸는데, 딱 한 가지 만지니 그날 바로 꽂혔어요.", n: "윤○○ 님", b: "별내점" },
      { t: "회비 하나도 안 아까운 곳, 여기가 처음이에요.", n: "임○○ 님", b: "오남점" },
      { t: "운동신경 없다고 평생 들었는데, 순서대로 알려주니 저도 하이클리어가 넘어가요. 못하는 게 아니라 안 배운 거였더라고요.", n: "한○○ 님", b: "별내점" },
      { t: "요즘 동호회에서 '너 어디 다니냐'는 말 자주 들어요. 티가 난대요.", n: "오○○ 님", b: "오남점" },
      { t: "한 달 만에 폼이 바뀌어서 제가 더 놀랐어요.", n: "서○○ 님", b: "별내점" },
      { t: "그만둘까 고민하던 찰나에 마지막으로 들렀어요. 막힌 이유를 그 자리에서 풀어주시는데, 다시 재밌어졌습니다. 안 왔으면 진짜 후회할 뻔했어요.", n: "신○○ 님", b: "오남점" },
      { t: "'힘 빼세요' 하는데, 빼니까 오히려 더 멀리 나가요. 신기합니다.", n: "권○○ 님", b: "별내점" },
      { t: "체험만 받아도 본전 뽑아요. 그날 바로 달라지거든요.", n: "황○○ 님", b: "오남점" },
      { t: "50대에 시작해서 늦었다 싶었는데, 나이 상관없이 차근차근 잡아줘요. 인생 운동 만났습니다. 요즘 주말이 기다려져요.", n: "안○○ 님", b: "별내점" },
      { t: "두 달 만에 첫 대회 나가서 입상했어요. 제가 입상이라니, 아직도 안 믿겨요.", n: "송○○ 님", b: "오남점" },
      { t: "다른 데랑 비교하기가 미안할 정도예요.", n: "류○○ 님", b: "별내점" },
      { t: "애 자세가 엉망이라 걱정했는데, 기초부터 다시 잡아주셔서 지금은 폼이 제일 예뻐요. 무엇보다 본인이 너무 좋아해서 그게 제일 만족스럽습니다.", n: "배○○ 님", b: "오남점" },
      { t: "여기 오고 나서 게임에서 지는 날이 확 줄었어요.", n: "문○○ 님", b: "별내점" },
      { t: "왜 진작 안 왔지, 요즘 이 생각만 들어요.", n: "조○○ 님", b: "오남점" },
      { t: "혼자 유튜브 보며 연습할 땐 늘 제자리였어요. 직접 봐주니 1주일 만에 바뀌는 걸 보고, 독학이 얼마나 비효율인지 깨달았습니다.", n: "남○○ 님", b: "별내점" },
      { t: "1:1이라 내 약점만 콕 집어 고쳐주니 진도가 빨라요.", n: "장○○ 님", b: "오남점" },
      { t: "전용 구장이라 아무 눈치 안 보고 칠 수 있어서 너무 좋아요.", n: "권○○ 님", b: "별내점" },
      { t: "구력 8년 차에 자존심 상해서 레슨은 안 받았어요. 근데 굳은 습관 하나 깨고 생각이 완전히 바뀌었습니다. 고수일수록 더 받아야 해요.", n: "백○○ 님", b: "오남점" },
      { t: "끝나고 나면 땀이 쫙 나요. 90분이 순삭입니다.", n: "고○○ 님", b: "별내점" },
      { t: "친구 꼬셔서 같이 다녀요. 둘 다 대만족이에요.", n: "전○○ 님", b: "오남점" },
      { t: "회사 스트레스 풀려고 시작했는데 실력까지 느니 일석이조예요. 일주일 중에 레슨 가는 날이 제일 기다려집니다. 강력 추천해요.", n: "홍○○ 님", b: "별내점" },
      { t: "리시브가 늘 한 박자 늦었는데, 스윙을 줄이니 눈에 띄게 빨라졌어요.", n: "차○○ 님", b: "오남점" },
      { t: "딸이 '엄마 나 배드민턴 선수 할래' 그래요. 그 말 듣고 울컥했네요.", n: "주○○ 님", b: "별내점" },
      { t: "처음엔 그냥 동네 레슨인 줄 알았어요. 근데 안트로크 코치님이 직접 봐주시는데 디테일이 다르더라고요. 이 가격에 이 퀄리티가 맞나 싶어요.", n: "구○○ 님", b: "오남점" },
      { t: "쿠폰제라 내 일정대로 잡을 수 있어서 직장인한테 딱이에요.", n: "민○○ 님", b: "오남점" },
      { t: "배운 대로 쳤더니 동호회 형들이 깜짝 놀라요.", n: "노○○ 님", b: "별내점" },
      { t: "운동 다시 시작하면서 살도 빼고 실력도 늘리고 싶었는데 둘 다 됐어요. '제대로 배우고 있다'는 확신이 들어서, 주변에 자신 있게 추천하고 있습니다.", n: "심○○ 님", b: "오남점" },
      { t: "헤어핀이 늘 떠서 죽었는데, 손목 각도 하나 바꾸니 딱 붙어요.", n: "천○○ 님", b: "별내점" },
      { t: "처음 와서 '나 같은 왕초보도 되나요?' 물었는데, 첫날 답이 나왔어요. 됩니다.", n: "방○○ 님", b: "오남점" },
      { t: "10년 친 친구보다 6개월 배운 제가 더 잘 쳐서 친구가 충격받았어요.", n: "표○○ 님", b: "별내점" },
      { t: "회사 동료들이랑 그룹으로 다니는데, 회식보다 이게 더 재밌어요.", n: "명○○ 님", b: "오남점" },
      { t: "코치님이 영상 찍어서 '여기 보세요' 하는데, 백 마디 설명보다 1초 만에 이해됐어요.", n: "기○○ 님", b: "별내점" },
      { t: "어깨가 안 좋아서 걱정했는데, 무리 안 가게 폼을 잡아주셔서 통증 없이 쳐요.", n: "라○○ 님", b: "오남점" },
      { t: "드라이브가 약했는데, 두 번 만에 라켓 끝 스피드가 달라졌어요.", n: "마○○ 님", b: "별내점" },
      { t: "수업 분위기가 빡세지 않고 즐거워서 운동 싫어하는 저도 계속 나와요.", n: "사○○ 님", b: "오남점" },
      { t: "동호회 가입하려고 시작했는데, 이제 제가 가르쳐달라는 소리 들어요.", n: "변○○ 님", b: "별내점" },
      { t: "남편이랑 같이 등록했는데 부부 취미가 생겨서 주말이 달라졌어요.", n: "성○○ 님", b: "오남점" },
      { t: "타이밍을 못 맞춰 헛스윙이 많았는데, 스텝부터 잡아주니 거짓말처럼 맞아요.", n: "차○○ 님", b: "별내점" },
      { t: "비싸면 어쩌나 했는데 90분에 이 가격이면 오히려 싸다 싶어요.", n: "주○○ 님", b: "오남점" },
      { t: "은퇴하고 소일거리로 시작했는데 인생 2막이 활기차졌습니다.", n: "우○○ 님", b: "별내점" },
      { t: "셔틀을 끝까지 못 보내서 답답했는데, 힘 쓰는 순서를 바꾸니 코트 끝까지 가요.", n: "구○○ 님", b: "오남점" },
      { t: "유튜브 댓글로만 보던 코치님께 직접 배운다니, 팬으로서 영광이에요.", n: "민○○ 님", b: "별내점" },
      { t: "초등생 아들이 학원보다 여기 가는 날을 더 좋아해요.", n: "진○○ 님", b: "오남점" },
      { t: "백핸드가 약점이었는데 두 달 집중하니 이제 자신 있게 쳐요.", n: "지○○ 님", b: "별내점" },
      { t: "다이어트로 시작했는데 한 달에 4kg 빠지고 실력도 늘어 일석이조예요.", n: "하○○ 님", b: "오남점" },
      { t: "다른 데선 한 반에 10명이라 거의 못 쳤는데, 여기선 쉴 틈이 없어요.", n: "곽○○ 님", b: "별내점" },
      { t: "스매시 각도가 안 나왔는데, 임팩트 순간 하나 고치니 꽂히기 시작했어요.", n: "노○○ 님", b: "오남점" },
      { t: "낯가림 심한데 코치님이 편하게 해주셔서 금방 적응했어요.", n: "심○○ 님", b: "별내점" },
      { t: "친구 따라 체험 갔다가 친구는 안 하고 저만 등록했어요.", n: "양○○ 님", b: "오남점" },
      { t: "구장이 깨끗하고 셔틀도 좋은 걸 써서 환경부터 다르더라고요.", n: "배○○ 님", b: "별내점" },
      { t: "예약이 구글폼으로 간단해서 바쁜 직장인한테 편해요.", n: "백○○ 님", b: "오남점" },
      { t: "대회 나가면 늘 1회전 탈락이었는데, 올해 처음 8강 갔어요.", n: "허○○ 님", b: "별내점" },
      { t: "코치님마다 말이 다르면 헷갈리는데, 여긴 다 같은 기준이라 안정적이에요.", n: "남○○ 님", b: "오남점" },
      { t: "한 시간이 순삭이에요. 끝나면 아쉬워서 더 치고 싶어요.", n: "전○○ 님", b: "별내점" },
      { t: "클럽에서 '레슨 받았냐'고 자꾸 물어봐요. 폼이 달라졌대요.", n: "홍○○ 님", b: "오남점" },
      { t: "운동 둔하다고 자책했는데, 안 되던 게 되니 자신감이 확 올라왔어요.", n: "고○○ 님", b: "별내점" },
      { t: "체험 때 진단해주신 약점이 그대로 고쳐지니까 믿음이 갔어요.", n: "문○○ 님", b: "오남점" },
      { t: "60대인데 젊은 사람들이랑 게임해도 안 밀려요. 너무 뿌듯합니다.", n: "손○○ 님", b: "별내점" },
      { t: "잘못된 그립을 평생 썼더라고요. 그거 하나 고치고 다 풀렸어요.", n: "양○○ 님", b: "오남점" },
      { t: "수업 끝나도 질문을 다 받아주셔서 궁금한 게 안 남아요.", n: "조○○ 님", b: "별내점" },
      { t: "스트레스 풀러 왔다가 실력까지 챙겨가요. 요즘 제일 잘한 선택이에요.", n: "윤○○ 님", b: "오남점" },
      { t: "처음엔 '한 달 해보고 결정해야지' 했는데 벌써 1년째예요.", n: "장○○ 님", b: "별내점" },
      { t: "발이 안 따라줘서 늘 늦었는데, 풋워크부터 잡아주니 코트가 좁게 느껴져요.", n: "임○○ 님", b: "오남점" },
      { t: "여기 다니고 나서 동호회 회비가 안 아까워졌어요. 이길 줄 아니까요.", n: "한○○ 님", b: "별내점" },
      { t: "안트로크 영상으로 입덕, 직접 배우고 완전 팬 됐어요.", n: "오○○ 님", b: "오남점" },
      { t: "수술 후 재활 겸 시작했는데 무리 없이 회복하면서 실력도 늘었어요.", n: "서○○ 님", b: "별내점" },
      { t: "딸이랑 같이 배워요. 요즘 딸이랑 대화가 부쩍 늘었어요.", n: "신○○ 님", b: "오남점" },
      { t: "스윙이 크고 느렸는데 직선으로 줄이니 한 박자 빨라졌어요.", n: "권○○ 님", b: "별내점" },
      { t: "체험 한 번에 1년 헤매던 게 풀려서 솔직히 좀 허탈했어요.", n: "황○○ 님", b: "오남점" },
      { t: "주차도 편하고 위치도 좋아서 다니기 부담이 없어요.", n: "안○○ 님", b: "별내점" },
      { t: "강습 받는 친구가 부러웠는데, 이제 제가 부러움 받는 쪽이에요.", n: "송○○ 님", b: "오남점" },
      { t: "긴장하면 폼이 무너졌는데, 실전처럼 연습시켜줘서 게임에서도 유지돼요.", n: "류○○ 님", b: "별내점" },
      { t: "초보라 민폐일까 걱정했는데 전용 구장이라 마음 편히 배워요.", n: "전○○ 님", b: "오남점" },
      { t: "1:1이라 제 페이스대로 가니까 스트레스가 없어요.", n: "배○○ 님", b: "별내점" },
      { t: "두 달 만에 클리어가 코트 끝까지 가는 걸 보고 가족이 더 놀랐어요.", n: "문○○ 님", b: "오남점" },
      { t: "퇴근하고 와도 안 피곤해요. 오히려 개운하게 갑니다.", n: "조○○ 님", b: "별내점" },
      { t: "코치님이 칭찬도 잘해주셔서 운동이 즐거워졌어요.", n: "남○○ 님", b: "오남점" },
      { t: "다른 학원 환불하고 여기로 옮겼어요. 후회 1도 없습니다.", n: "장○○ 님", b: "별내점" },
      { t: "셔틀 컨트롤이 안 됐는데, 그립 압력 조절을 배우고 정교해졌어요.", n: "강○○ 님", b: "오남점" },
      { t: "운동 시작하고 잠도 잘 자고 컨디션이 확 좋아졌어요.", n: "윤○○ 님", b: "별내점" },
      { t: "친절한데 가르칠 땐 확실해서 실력이 안 늘 수가 없어요.", n: "임○○ 님", b: "오남점" },
      { t: "예전엔 게임만 했는데, 기본기 잡으니 게임이 더 재밌어졌어요.", n: "한○○ 님", b: "별내점" },
      { t: "여기 와서 처음으로 '배드민턴 제대로 배운다'는 느낌을 받았어요.", n: "오○○ 님", b: "오남점" },
      { t: "주니어반인데 아이가 대회 욕심을 내기 시작했어요.", n: "서○○ 님", b: "별내점" },
      { t: "스매시 받을 때 무서웠는데, 리시브 자세를 잡으니 이제 즐겨요.", n: "신○○ 님", b: "오남점" },
      { t: "동네에서 제일 잘 친다는 소리 들으려고 다녀요. 거의 다 왔어요.", n: "권○○ 님", b: "별내점" },
      { t: "체험 끝나고 '이런 데가 있었네' 싶어서 바로 8회권 끊었어요.", n: "황○○ 님", b: "오남점" },
      { t: "혼자선 절대 못 고쳤을 습관을 한 번에 잡아주셨어요.", n: "안○○ 님", b: "별내점" },
      { t: "수강생 단톡방에 자료도 공유해주셔서 복습이 잘 돼요.", n: "송○○ 님", b: "오남점" },
      { t: "몸치라고 놀림받던 제가 동호회 에이스 소리 들어요. 인생 역전이에요.", n: "류○○ 님", b: "별내점" },
      { t: "운동을 이렇게 논리적으로 가르치는 데는 처음 봤어요.", n: "전○○ 님", b: "오남점" },
      { t: "예약부터 수업까지 신수경 운영자님이 친절하게 챙겨주셔서 편해요.", n: "배○○ 님", b: "별내점" },
      { t: "다른 데 6개월 vs 여기 1개월, 변화가 더 컸어요.", n: "백○○ 님", b: "오남점" },
      { t: "처음 잡은 라켓으로 한 달 만에 랠리가 이어져서 신기해요.", n: "허○○ 님", b: "별내점" },
      { t: "솔직히 후기 안 믿었는데, 직접 겪어보니 진짜였어요. 와보세요.", n: "남○○ 님", b: "오남점" }
    ];
    /* 매 방문마다 순서 랜덤 (들어올 때마다 다른 후기) */
    for (var s = REVIEWS.length - 1; s > 0; s--) {
      var k = Math.floor(Math.random() * (s + 1));
      var tmp = REVIEWS[s]; REVIEWS[s] = REVIEWS[k]; REVIEWS[k] = tmp;
    }
    var STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 17.8 5.4 21.2 6.7 14.2 1.7 9.4l7-.9z"/></svg>';
    var stars = '<div class="stars">' + STAR + STAR + STAR + STAR + STAR + '</div>';
    var rh = '';
    var SHOW = Math.min(40, REVIEWS.length); /* 100개 풀에서 40개만 무작위 노출 (방문마다 다름) */
    for (var r = 0; r < SHOW; r++) {
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
      try { document.execCommand('copy'); ok(); } catch (e) { showToast('복사 실패 - 주소창에서 직접 복사해 주세요'); }
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
