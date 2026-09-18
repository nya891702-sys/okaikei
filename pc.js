const N=["チョコオールド","クランチキャラメル","シュガーリング","シュガーツイスト","いちご","チョコ","ホワイト","キャラメル"];
const defaults=N.map(name=>({name,price:150,max:50,stock:50}));
let P=JSON.parse(localStorage.getItem("qrpos_products")||"null")||defaults.map(x=>({...x}));
let Q=Array(8).fill(0), H=JSON.parse(localStorage.getItem("qrpos_history")||"[]");
const yen=n=>"¥"+Math.round(n).toLocaleString("ja-JP");
function save(){localStorage.setItem("qrpos_products",JSON.stringify(P));localStorage.setItem("qrpos_history",JSON.stringify(H));}
function render(){
  products.innerHTML=P.map((p,i)=>`<div class="product"><h3>${p.name}</h3><div class="price">${yen(p.price)}</div><div>在庫：${p.stock}個</div><div class="qty"><button onclick="changeQty(${i},-1)">−</button><strong>${Q[i]}</strong><button onclick="changeQty(${i},1)" ${Q[i]>=p.stock?"disabled":""}>＋</button></div></div>`).join("");
  total.textContent=yen(Q.reduce((s,q,i)=>s+q*P[i].price,0));
  stock.innerHTML=P.map(p=>`<div class="stock-row"><span>${p.name}</span><b class="${p.stock===0?"zero":p.stock<=5?"low":""}">${p.stock}個</b></div>`).join("");
  settings.innerHTML=P.map((p,i)=>`<div class="setting"><b>${p.name}</b><label>価格<input id="price${i}" type="number" min="0" value="${p.price}"></label><label>最大<input id="max${i}" type="number" min="0" max="99" value="${p.max}"></label></div>`).join("");
  history.innerHTML=H.length?H.slice().reverse().map(h=>`<div class="history-row"><span>#${String(h.id).padStart(4,"0")} ${h.items.map(x=>x.name+"×"+x.qty).join(" / ")}</span><b>${yen(h.total)}</b></div>`).join(""):"履歴なし";
}
function changeQty(i,d){Q[i]=Math.max(0,Math.min(P[i].stock,Q[i]+d));render();}
function saveSettings(){P.forEach((p,i)=>{p.price=Math.max(0,+document.getElementById("price"+i).value||0);p.max=Math.max(0,Math.min(99,+document.getElementById("max"+i).value||0));p.stock=Math.min(p.stock,p.max)});save();render();alert("設定を保存しました");}
function createOrder(){
  if(!Q.some(Boolean)){alert("商品を1つ以上選択してください");return;}
  const id=(H.length?H[H.length-1].id:0)+1;
  const items=Q.map((qty,i)=>qty?{name:N[i],qty,price:P[i].price}:null).filter(Boolean);
  const totalPrice=items.reduce((s,x)=>s+x.qty*x.price,0);
  const data=["B07",String(id).padStart(4,"0"),Q.join(","),P.map(p=>Math.round(p.price)).join(",")].join("|");
  H.push({id,items,total:totalPrice});Q.forEach((q,i)=>P[i].stock-=q);save();render();
  qrcode.innerHTML="";
  if(typeof QRCode==="undefined"){alert("QRライブラリを読み込めませんでした。インターネット接続を確認してください。");return;}
  new QRCode(qrcode,{text:data,width:300,height:300,correctLevel:QRCode.CorrectLevel.M});
  qrTitle.textContent=`注文 #${String(id).padStart(4,"0")}　${yen(totalPrice)}`;
  qrData.textContent=data;qrModal.hidden=false;
  pngData=data;
}
let pngData="";
orderBtn.onclick=createOrder;saveBtn.onclick=saveSettings;
clearBtn.onclick=()=>{if(confirm("履歴を消去しますか？")){H=[];save();render();}};
closeBtn.onclick=()=>qrModal.hidden=true;newBtn.onclick=()=>qrModal.hidden=true;
qrModal.addEventListener("click",e=>{if(e.target===qrModal)qrModal.hidden=true});
printBtn.onclick=()=>window.print();
render();
