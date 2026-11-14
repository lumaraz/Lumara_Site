/* Páginas de cliente (portal, proposta, contrato, recibo): carrega os dados desta pessoa do servidor.
   Na volta da página de pagamento, confirma o pagamento antes de mostrar a página. */
(function(){
  var q=new URLSearchParams(location.search), id=location.hash.slice(1)||q.get("id")||"";
  if(q.get("retorno")){
    document.documentElement.style.visibility="hidden";
    var limpo=location.pathname+"#"+encodeURIComponent(id);
    var p=q.get("transaction_nsu")?fetch("/api/confirmar",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({order_nsu:q.get("order_nsu"),transaction_nsu:q.get("transaction_nsu"),slug:q.get("slug"),receipt_url:q.get("receipt_url")})}).catch(function(){}):Promise.resolve();
    p.then(function(){location.replace(limpo)});
    return;
  }
  document.write('<script src="/api/cliente?id='+encodeURIComponent(id)+'"><\/script>');
})();
