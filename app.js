const NAMES=["チョコオールド","クランチキャラメル","シュガーリング","シュガーツイスト","いちご","チョコ","ホワイト","キャラメル"];
const DEFAULT={shop:"文化祭",tax:0,products:NAMES.map(n=>({name:n,price:150,max:50,stock:50}))};
let data=JSON.parse(localStorage.getItem("bunkasaiPOS")||"null")||structuredClone(DEFAULT);
let history=JSON.parse(localStorage.getItem("bunkasaiHistory")||"[]"), order=Array(8).fill(0), scanner=null, scanning=false;
const save=()=>{localStorage.setItem("bunkasaiPOS",JSON.stringify(data));localStorage.setItem("bunkasaiHistory",JSON.stringify(history))};
const yen=n=>"¥"+Math.round(n).toLocaleString("ja-JP");

function renderProducts(){products.innerHTML=data.products.map((p,i)=>`<div class="product ${p.stock===0?"soldout":""}"><h3>${p.name}</h3><div class="price">${yen(p.price)}</div><div class="stock-label">在庫 ${p.stock}個</div><div class="qty"><button onclick="changeQty(${i},-1)">−</button><strong>${order[i]}</strong><button onclick="changeQty(${i},1)" ${order[i]>=p.stock?"disabled":""}>＋</button></div></div>`).join("");renderCart()}
function changeQty(i,d){order[i]=Math.max(0,Math.min(data.products[i].stock,order[i]+d));renderProducts()}
function renderCart(){let total=0;cartItems.innerHTML=order.map((q,i)=>{total+=q*data.products[i].price;return q?`<div class="cart-row"><span>${data.products[i].name} × ${q}</span><span>${yen(q*data.products[i].price)}</span></div>`:""}).join("")||'<p class="message">商品がありません</p>';cartTotal.textContent=yen(total)}
function renderStock(){stockGrid.innerHTML=data.products.map(p=>`<div class="stock-card ${p.stock===0?"zero":p.stock<=5?"low":""}"><h3>${p.name}</h3><div class="num">${p.stock}</div><div>個</div></div>`).join("")}
function renderSettings(){shopName.value=data.shop;taxRate.value=data.tax;settingsGrid.innerHTML=data.products.map((p,i)=>`<div class="setting-row"><strong>${p.name}</strong><label>価格<input id="price-${i}" type="number" min="0" value="${p.price}"></label><label>最大在庫<input id="max-${i}" type="number" min="0" max="99" value="${p.max}"></label></div>`).join("")}
function renderHistory(){historyList.innerHTML=history.length?history.slice().reverse().map(h=>`<div class="history-item"><strong>#${String(h.id).padStart(4,"0")}</strong> <span class="badge ${h.paid?"paid":""}">${h.paid?"会計済み":"会計待ち"}</span><p>${new Date(h.time).toLocaleString("ja-JP")}</p>${h.items.map(x=>`${x.name} ×${x.qty}`).join(" / ")}<div><strong>${yen(h.total)}</strong></div></div>`).join(""):"<p class='message'>履歴はありません。</p>"}
function renderAll(){renderProducts();renderStock();renderSettings();renderHistory()}
function codeFor(h){return "B02"+String(h.id).padStart(4,"0")+h.items.map(x=>String(x.qty).padStart(2,"0")).join("")}

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById(b.dataset.page).classList.add("active");if(b.dataset.page!=="pay")stopCamera()});
clearOrder.onclick=()=>{order=Array(8).fill(0);renderProducts()};
confirmOrder.onclick=()=>{
 if(!order.some(Boolean))return alert("商品を1つ以上選んでください。");
 for(let i=0;i<8;i++)if(order[i]>data.products[i].stock)return alert("在庫が足りません。");
 const id=(history.at(-1)?.id||0)+1,items=order.map((q,i)=>q?{name:data.products[i].name,qty:q}:null).filter(Boolean),total=order.reduce((s,q,i)=>s+q*data.products[i].price,0);
 const h={id,time:Date.now(),items,total,paid:false};order.forEach((q,i)=>data.products[i].stock-=q);history.push(h);save();renderAll();
 const code=codeFor(h);JsBarcode("#barcode",code,{format:"CODE128",displayValue:true,fontSize:15,height:95,margin:15});
 orderNumberText.textContent=`注文 #${String(h.id).padStart(4,"0")}　合計 ${yen(h.total)}`;barcodeValue.textContent=code;barcodeModal.classList.remove("hidden");order=Array(8).fill(0)
};
closeModal.onclick=()=>barcodeModal.classList.add("hidden");printBarcode.onclick=()=>window.print();
saveSettings.onclick=()=>{data.shop=shopName.value||"文化祭";data.tax=Math.max(0,Number(taxRate.value)||0);data.products.forEach((p,i)=>{p.price=Math.max(0,Number(document.getElementById(`price-${i}`).value)||0);p.max=Math.max(0,Math.min(99,Number(document.getElementById(`max-${i}`).value)||0));if(p.stock>p.max)p.stock=p.max});save();renderAll();settingMessage.textContent="設定を保存しました。"};
resetAll.onclick=()=>{if(confirm("全データを初期化しますか？")){data=structuredClone(DEFAULT);history=[];order=Array(8).fill(0);save();renderAll()}};
clearHistory.onclick=()=>{if(confirm("履歴を全削除しますか？")){history=[];save();renderHistory()}};

function showPayment(raw){
 try{
  raw=String(raw).trim();if(!raw.startsWith("B02"))throw Error("このPOS用バーコードではありません。");
  const id=Number(raw.slice(3,7)),h=history.find(x=>x.id===id);if(!h)throw Error("PC側にこの注文番号がありません。");
  paymentResult.innerHTML=`<div class="payment-card"><h2>注文 #${String(h.id).padStart(4,"0")}</h2>${h.items.map(x=>`<div class="cart-row"><span>${x.name} ×${x.qty}</span><strong>${yen(x.qty*data.products.find(p=>p.name===x.name).price)}</strong></div>`).join("")}<div class="payment-total">合計 ${yen(h.total)}</div>${h.paid?'<div class="pay-ok">この注文は会計済みです。</div>':`<button class="primary big" onclick="markPaid(${h.id})">会計完了</button>`}</div>`;
  scanStatus.textContent="読み取り成功";
 }catch(e){scanStatus.textContent=e.message}
}
window.markPaid=id=>{let h=history.find(x=>x.id===id);if(h){h.paid=true;save();renderHistory();showPayment(codeFor(h))}};
manualRead.onclick=()=>showPayment(manualCode.value);
async function startCamera(){
 if(scanning)return;try{scanner=new ZXingBrowser.BrowserMultiFormatReader();scanning=true;scanStatus.textContent="カメラ起動中...";
 const ds=await ZXingBrowser.BrowserCodeReader.listVideoInputDevices(),deviceId=ds.length?ds[ds.length-1].deviceId:undefined;
 await scanner.decodeFromVideoDevice(deviceId,"video",(r)=>{if(r)showPayment(r.getText())});
 }catch(e){scanning=false;scanStatus.textContent="カメラを起動できません。HTTPS/localhostとカメラ許可を確認してください。"}}
function stopCamera(){if(scanner){try{scanner.reset()}catch(e){}scanner=null}scanning=false}
startCamera.onclick=startCamera;stopCamera.onclick=stopCamera;renderAll();