const N=["チョコオールド","クランチキャラメル","シュガーリング","シュガーツイスト","いちご","チョコ","ホワイト","キャラメル"];
let stream=null,canvas=document.createElement("canvas"),ctx=canvas.getContext("2d"),scanning=false;
const yen=n=>"¥"+Math.round(n).toLocaleString("ja-JP");
function showOrder(raw){
  try{
    const parts=String(raw).trim().split("|");
    if(parts.length!==4||parts[0]!=="B07")throw new Error("文化祭POSのQRではありません");
    const id=parts[1],q=parts[2].split(",").map(Number),p=parts[3].split(",").map(Number);
    if(q.length!==8||p.length!==8)throw new Error("QRデータが不正です");
    let total=0,html=`<div class="receipt"><h2>注文 #${id}</h2>`;
    q.forEach((qty,i)=>{if(qty>0){const sub=qty*p[i];total+=sub;html+=`<div class="line"><span>${N[i]} × ${qty}</span><b>${yen(sub)}</b></div>`;}});
    html+=`<div class="grand">合計 ${yen(total)}</div><button class="done" id="finish">会計完了</button></div>`;
    receipt.innerHTML=html;status.textContent="読み取り成功";
    document.getElementById("finish").onclick=()=>{receipt.innerHTML='<div class="receipt"><h2>会計完了</h2><p>ありがとうございました。</p></div>';stopCamera();};
  }catch(e){status.textContent=e.message;}
}
async function startCamera(){
  try{
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error("このブラウザではカメラを利用できません");
    if(!window.isSecureContext)throw new Error("HTTPSで開いてください");
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false});
    video.srcObject=stream;await video.play();scanning=true;status.textContent="カメラ起動中。QRコードを枠内へ。";scan();
  }catch(e){status.textContent=e.message+"。Safariのカメラ許可も確認してください。";}
}
function scan(){
  if(!scanning||!stream)return;
  if(video.readyState>=2&&video.videoWidth){
    canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const img=ctx.getImageData(0,0,canvas.width,canvas.height);
    if(typeof jsQR==="function"){const code=jsQR(img.data,img.width,img.height,{inversionAttempts:"attemptBoth"});if(code){showOrder(code.data);return;}}
  }
  requestAnimationFrame(scan);
}
function stopCamera(){scanning=false;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}video.srcObject=null;status.textContent="停止しました";}
startBtn.onclick=startCamera;stopBtn.onclick=stopCamera;manualBtn.onclick=()=>showOrder(manualCode.value);
