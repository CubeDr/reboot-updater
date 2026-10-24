(function () {
  'use strict';
  var link = document.getElementById('member-app-link');
  var records = document.getElementById('member-record-link');
  var status = document.getElementById('member-status');
  if (!link || !records || !status) return;
  // Fail closed: no address, relative URL, credentials or non-HTTPS => no link.
  link.hidden = true;
  link.removeAttribute('href');
  records.hidden = true;
  records.removeAttribute('href');
  var config = window.REBOOT_MEMBER_CONFIG || {};
  if (typeof config.appUrl !== 'string' || !config.appUrl.trim()) return;
  try {
    var raw = config.appUrl.trim();
    if (!/^https:\/\//i.test(raw) || /[\u0000-\u0020\u007f\\]/.test(raw)) return;
    var url = new URL(raw);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return;
    // Only the two verified app tabs are used; no identity or token is passed.
    url.hash = 'schedule';
    link.href = url.href;
    url.hash = 'chart';
    records.href = url.href;
    records.hidden = false;
    link.hidden = false;
    status.textContent = '회원 예약과 레슨 기록은 별도 운영 앱에서 이용할 수 있습니다.';
  } catch (error) {
    // Keep the existing consultation and journal links available.
  }
})();
