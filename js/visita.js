/* Conta a visita (página, dia e origem). A equipe logada não é contada. */
(function(){
  try{ if(sessionStorage.getItem("lumara_equipe")==="1") return; }catch(e){}
  if(navigator.webdriver) return;
  var ref=document.referrer;
  function contar(){
    var d=JSON.stringify({p:location.pathname+location.hash,r:ref});
    try{ if(navigator.sendBeacon&&navigator.sendBeacon("/api/visita",d)) return; }catch(e){}
    try{ fetch("/api/visita",{method:"POST",body:d,keepalive:true}); }catch(e){}
    ref=location.href;
  }
  contar();
  addEventListener("hashchange",function(){ if(/projeto/.test(location.pathname)){ ref=location.href; contar(); } });
})();
