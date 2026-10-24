
    // 모션 최소화 설정을 켠 분에게는 히어로 영상을 멈추고 첫 프레임(포스터)만 보여줍니다
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.hero__media video').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
    }
  