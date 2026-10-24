
  (function(){
    var ruler = document.getElementById('ruler');
    if(!ruler) return;
    var TOTAL = 18;
    function pct(m){ return (m/TOTAL*100).toFixed(3) + '%'; }
    for(var m=0; m<=TOTAL; m++){
      var t = document.createElement('div');
      var isMajor = [0,6,12,18].indexOf(m) !== -1;
      t.className = 'tick' + (isMajor ? ' major' : '');
      t.style.left = pct(m);
      ruler.appendChild(t);
      if(isMajor){
        var l = document.createElement('span');
        l.className = 'tick-label';
        l.style.left = pct(m);
        l.textContent = m === 0 ? 'START' : m + 'M';
        ruler.appendChild(l);
      }
    }
    var segs = [
      {code:'R0', label:'BASIC',   mid:3},
      {code:'R1', label:'TECHNIC', mid:9},
      {code:'R2', label:'ADVANCE', mid:15}
    ];
    segs.forEach(function(s){
      var el = document.createElement('div');
      el.className = 'seg-label';
      el.style.left = pct(s.mid);
      el.innerHTML = s.code + '<small>' + s.label + '</small>';
      ruler.appendChild(el);
    });
    [6,12].forEach(function(m){
      var n = document.createElement('div');
      n.className = 'node';
      n.style.left = pct(m);
      ruler.appendChild(n);
    });
    var fin = document.createElement('div');
    fin.className = 'node final';
    fin.style.left = pct(18);
    ruler.appendChild(fin);

    function fill(el){
      if(el.classList.contains('lv')){
        var vals = (el.dataset.gauges || '').split(',');
        el.querySelectorAll('.g-fill').forEach(function(g,i){ g.style.width = (vals[i]||0) + '%'; });
      }
      el.querySelectorAll('.bar-fill').forEach(function(b){ b.style.width = b.dataset.w + '%'; });
    }
    var targets = document.querySelectorAll('.lv, .compare');
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(!e.isIntersecting) return;
          fill(e.target); io.unobserve(e.target);
        });
      }, {threshold:.35});
      targets.forEach(function(el){ io.observe(el); });
      // 관찰이 발동하지 않는 환경 대비 폴백 (채움은 멱등)
      setTimeout(function(){ targets.forEach(fill); }, 3000);
    } else {
      targets.forEach(fill);
    }
  })();
  