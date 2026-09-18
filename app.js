const NAMES=["チョコオールド","クランチキャラメル","シュガーリング","シュガーツイスト","いちご","チョコ","ホワイト","キャラメル"];
const DEFAULT={products:NAMES.map(n=>({name:n,price:150,max:50,stock:50}))};
let data=JSON.parse(localStorage.getItem("simplePOS")||"null")||structuredClone(DEFAULT);
let history=JSON.parse(localStorage.getItem("simplePOSHistory")||"[]");
let cart=Array(8).fill(0),scanner=null,scanning=false;

function save(){localStorage.setItem("simplePOS",JSON.stringify(data));localStorage.setItem("simplePOSHistory",JSON.stringify(history))}
function yen(n){return "¥"+Math.round(n).toLocaleString("ja-JP")}
function renderProducts(){products.innerHTML=data.products.map((p,i)=>`<div class="product ${p.stock===0?"soldout":""}"><h3>${p.name}</h3><div class="price">${yen(p.price)}</div><div class="muted">在庫 ${p.stock}個</div><div class="qty"><button onclick="change(${i},-1)">−</button><b>${cart[i]}</b><button onclick="change(${i},1)" ${cart[i]>=p.stock?"disabled":""}>＋</button></div></div>`).join("");renderCart()}
function change(i,d){cart[i]=Math.max(0,Math.min(data.products[i].stock,cart[i]+d));renderProducts()}
function renderCart(){let t=0;cartEl=cart;cart.forEach((q,i)=>t+=q*data.products[i].price);cartBox.innerHTML=cart.map((q,i)=>q?`<div class="cart-row"><span>${data.products[i].name} ×${q}</span><span>${yen(q*data.products[i].price)}</span></div>`:"").join("")||'<p class="muted">商品がありません</p>';total.textContent=yen(t)}
function renderStock(){stock.innerHTML=data.products.map(p=>`<div class="stock-item ${p.stock===0?"zero":p.stock<=5?"low":""}"><span>${p.name}</span><br><b>${p.stock}</b> 個</div>`).join("")}
function renderHistory(){historyBox.innerHTML=history.length?history.slice().reverse().map(h=>`<div class="history-item"><b>#${String(h.id).padStart(4,"0")}</b>　${new Date(h.time).toLocaleString("ja-JP")}<br>${h.items.map(x=>x.name+" ×"+x.qty).join(" / ")}<br><b>${yen(h.total)}</b></div>`).join(""):"<p class='muted'>履歴はありません。</p>"}
function renderSettings(){settings.innerHTML=data.products.map((p,i)=>`<div class="setting-row"><strong>${p.name}</strong><label>価格<input id="p${i}" type="number" min="0" value="${p.price}"></label><label>最大<input id="m${i}" type="number" min="0" max="99" value="${p.max}"></label></div>`).join("")}
function render(){renderProducts();renderStock();renderHistory();renderSettings()}

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById(b.dataset.page).classList.add("active");if(b.dataset.page!=="iphone")stopCamera()});
settingsBtn.onclick=()=>settingsModal.classList.remove("hidden");
closeSettings.onclick=()=>settingsModal.classList.add("hidden");
clearOrder.onclick=()=>{cart=Array(8).fill(0);renderProducts()};
save.onclick=()=>{data.products.forEach((p,i)=>{p.price=Math.max(0,Number(document.getElementById("p"+i).value)||0);const m=Math.max(0,Math.min(99,Number(document.getElementById("m"+i).value)||0));p.max=m;if(p.stock>m)p.stock=m});save();render();settingsModal.classList.add("hidden")};
resetDummy=()=>{};
confirm.onclick=()=>{
 if(!cart.some(Boolean))return alert("商品を1つ以上選んでください。");
 const id=(history.at(-1)?.id||0)+1,items=cart.map((q,i)=>q?{name:data.products[i].name,qty:q}:null).filter(Boolean),t=cart.reduce((s,q,i)=>s+q*data.products[i].price,0);
 const h={id,time:Date.now(),items,total:t};cart.forEach((q,i)=>data.products[i].stock-=q);history.push(h);save();render();
 const code="B03"+String(id).padStart(4,"0")+cart.map(q=>String(q).padStart(2,"0")).join("");
 JsBarcode("#barcode",code,{format:"CODE128",displayValue:true,fontSize:15,height:95,margin:15});
 orderNo.textContent=`注文 #${String(id).padStart(4,"0")}　合計 ${yen(t)}`;rawCode.textContent=code;barcodeModal.classList.remove("hidden");cart=Array(8).fill(0)
};
closeBarcode.onclick=()=>barcodeModal.classList.add("hidden");print.onclick=()=>window.print();
clearHistory.onclick=()=>{if(confirm("注文履歴を削除しますか？")){history=[];save();renderHistory()}};

function showPayment(raw){
 try{
  raw=String(raw).trim();if(!raw.startsWith("B03"))throw Error("このPOS用バーコードではありません。");
  const id=Number(raw.slice(3,7)),digits=raw.slice(7);if(!/^\d{16}$/.test(digits))throw Error("バーコードのデータが正しくありません。");
  const qs=Array.from({length:8},(_,i)=>Number(digits.slice(i*2,i*2+2)));
  const lines=qs.map((q,i)=>q?`<div class="cart-row"><span>${NAMES[i]} ×${q}</span><strong>${yen(q*data.products[i].price)}</strong></div>`:"").join("");
  const sum=qs.reduce((s,q,i)=>s+q*data.products[i].price,0);
  payment.innerHTML=`<div class="payment"><h2>注文 #${String(id).padStart(4,"0")}</h2>${lines}<div class="pay-total">合計 ${yen(sum)}</div><button class="main-btn" onclick="finishPayment()">会計完了</button></div>`;
  status.textContent="読み取り成功";
 }catch(e){status.textContent=e.message}
}
function finishPayment(){payment.innerHTML=`<div class="payment"><h2>会計完了</h2><p>ありがとうございました。</p></div>`}
manual.onclick=()=>showPayment(codeInput.value);
async function startCamera(){if(scanning)return;try{scanner=new ZXingBrowser.BrowserMultiFormatReader();scanning=true;status.textContent="カメラ起動中...";const ds=await ZXingBrowser.BrowserCodeReader.listVideoInputDevices();const id=ds.length?ds[ds.length-1].deviceId:undefined;await scanner.decodeFromVideoDevice(id,"video",(r)=>{if(r)showPayment(r.getText())})}catch(e){scanning=false;status.textContent="カメラを起動できません。HTTPS/localhostとカメラ許可を確認してください。"}}
function stopCamera(){if(scanner){try{scanner.reset()}catch(e){}scanner=null}scanning=false}
start.onclick=startCamera;stop.onclick=stopCamera;render();