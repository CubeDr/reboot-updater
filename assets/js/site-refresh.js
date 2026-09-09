(() => {
  'use strict';
  const nav=document.querySelector('[data-nav]');
  const toggle=document.querySelector('[data-nav-toggle]');
  const closeNav=() => { nav?.setAttribute('data-open','false'); toggle?.setAttribute('aria-expanded','false'); toggle?.setAttribute('aria-label','메뉴 열기'); };
  toggle?.addEventListener('click',()=>toggle.setAttribute('aria-label',toggle.getAttribute('aria-expanded')==='true'?'메뉴 닫기':'메뉴 열기'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.getAttribute('data-open')==='true'){closeNav();toggle.focus();}});
  document.addEventListener('click',e=>{if(nav&&!nav.contains(e.target))closeNav();});
  matchMedia('(min-width:761px)').addEventListener('change',closeNav);
  const branch=new URLSearchParams(location.search).get('branch');
  const context=document.querySelector('[data-booking-context]');
  if(context&&['onam','byeollae'].includes(branch)) {
    context.textContent=(branch==='onam'?'오남점':'별내점')+' 레슨 문의 · 신청서에서 희망 지점을 선택해 주세요.';
    context.hidden=false;
  }
  document.querySelectorAll('.staff-card').forEach(card=>{
    const name=card.querySelector('.staff-card__name')?.textContent.trim();
    const a=card.querySelector('.staff-inquiry');
    if(a&&name)a.setAttribute('aria-label',name+' 레슨 문의');
  });
  const pictures=[...document.querySelectorAll('.g-card__img img')];
  if(pictures.length&&typeof HTMLDialogElement!=='undefined') {
    const dialog=document.createElement('dialog');dialog.className='photo-viewer';dialog.setAttribute('aria-label','갤러리 사진 크게 보기');
    dialog.innerHTML='<div class="photo-viewer-bar"><button type="button" data-prev aria-label="이전 사진">←</button><span data-count></span><button type="button" data-next aria-label="다음 사진">→</button><button type="button" data-close aria-label="사진 닫기">✕</button></div><img alt=""><p class="photo-viewer-caption"></p>';
    document.body.append(dialog);let current=0,opener;
    const show=i=>{current=(i+pictures.length)%pictures.length;const p=pictures[current];dialog.querySelector('img').src=p.currentSrc||p.src;dialog.querySelector('img').alt=p.alt;dialog.querySelector('.photo-viewer-caption').textContent=p.alt;dialog.querySelector('[data-count]').textContent=(current+1)+' / '+pictures.length;};
    pictures.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='gallery-open';b.setAttribute('aria-label',p.alt+' 사진 크게 보기');p.replaceWith(b);b.append(p);b.addEventListener('click',()=>{opener=b;show(i);dialog.showModal();});});
    dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
    dialog.querySelector('[data-prev]').addEventListener('click',()=>show(current-1));
    dialog.querySelector('[data-next]').addEventListener('click',()=>show(current+1));
    dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();show(current-1);}if(e.key==='ArrowRight'){e.preventDefault();show(current+1);}});
    dialog.addEventListener('close',()=>opener?.focus());
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  }
})();
