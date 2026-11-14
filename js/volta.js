/* Atalho de volta para a área da equipe: aparece só para quem abriu a área da equipe nesta sessão
   (no protótipo, os links internos abrem na mesma página). */
(function(){
  let ok=false; try{ok=sessionStorage.getItem("lumara_equipe")==="1"}catch(e){}
  if(!ok) return;
  const a=document.createElement("a");
  a.href="admin/index.html"; a.textContent="← Área da equipe";
  a.setAttribute("style","position:fixed;left:1rem;bottom:1rem;z-index:90;background:#2D2D2D;color:#F2EFE9;font:600 .88rem 'Inter Tight',system-ui,sans-serif;text-decoration:none;padding:.6rem 1rem;border-radius:99px;box-shadow:0 8px 20px -8px rgba(0,0,0,.5)");
  const nav=document.createElement("nav"); nav.setAttribute("aria-label","Atalho da equipe"); nav.appendChild(a);
  document.body.appendChild(nav);
})();
