# 文化祭POS QR版

PCとiPhoneは通信しません。

PC側:
- 商品8種類固定
- 個数、価格、最大在庫
- 在庫表示
- 注文履歴
- QRコード生成

iPhone側:
- カメラ起動
- QRコード自動読み取り
- 個数・価格をQRから取得
- iPhone側で合計計算
- 会計完了

GitHub Pagesでは全ファイルを同じ階層に置いてください。
カメラはHTTPSで利用してください。
QR生成と読み取りはCDNの qrcode.js / jsQR を使用します。
