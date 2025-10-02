README.md

# Discord Server Cloner / Backup Bot 🚀

**Warning ⚠️:** Misuse of this bot may violate Discord Terms of Service. Use at your own risk. The author is not responsible for any account or server issues.

**Uyarı ⚠️:** Bu botun kullanımı Discord Hizmet Şartlarını ihlal edebilir. Kullanım tamamen sizin sorumluluğunuzdadır.hesaplarınız veya sunucularınızla ilgili herhangi bir sorumluluk kabul etmem
---

## 🔹 Features / Özellikler

- **Sunucu Kopyalama / Yedekleme**:
  - Bir kaynaktan hedef sunucuya **roller, kategoriler ve kanalları** birebir kopyalar.
  - Kategoriler ve kanallar **pozisyonları ile birlikte** aynı sırada oluşturulur.
  - Rolleri kaynak **sunucudaki izinlerle** birebir oluşturur.
  - Sunucu adını hedef sunucuya uygular.
  - Başarısız olan işlemler **konsola ve owner belirtilen kişinin DM’ine** detaylı olarak bildirilir.
  

- **Owner Yönetimi**:
  - `!sahipekle` → Config’e kalıcı owner ekler  
  - `!sahipsil` → Config’ten owner siler  
  - `!owners` → Mevcut ownerları listeler

- **Ping Komutu**:
  - `!ping` → Botun aktif olduğunu hızlıca kontrol etme komutu.

---

## ⚡ Kurulum / Installation

1. Depoyu klonlayın:

```bash
git clone https://github.com/Burak-16/nsfw-selfbot-v3.git
cd nsfw-selfbot-v3
```

2. Node.js ve gerekli paketleri kurun (Node.js ≥16):

```bash
npm install discord.js-selfbot-v13 wio.db node-fetch chalk
```

3. `Config.js` dosyasını kendi token ve owner ID’lerinizle doldurun:

```js
module.exports = {
  BOT: {
    token: "BOT_TOKENINIZI_BURAYA_GIRIN",
    owners: ["OWNERID1"]
  }
};
```

4. Botu başlatın:

```bash
node main.js
```

---

## ⚠️ Sorumluluk / Disclaimer

- Bu bot **Discord API kullanır**. Yanlış kullanım veya aşırı kopyalama işlemleri **hesap veya sunucu kısıtlamalarına** yol açabilir.
- Kullanıcı tamamen sorumludur. Proje geliştiricisi veya sahibi **hesaplarınız veya sunucularınız için sorumlu değildir**.
- Lütfen botu **yalnızca kendi sahip olduğunuz sunucularda veya izinli sunucularda** kullanın.

---

## 📌 Komutlar

| Komut | Açıklama |
|-------|----------|
| `!kanalkopyala <kaynakSunucuID> <hedefSunucuID>` | Kaynak sunucuyu hedef sunucuya birebir kopyalar (roller, kategoriler, kanallar, ikon, isim) |
| `!sahipekle <ID>` | Config’e kalıcı owner ekler |
| `!sahipsil <ID>` | Config’ten owner siler |
| `!owners` | Mevcut ownerları listeler |
| `!ping` | Botun aktif olduğunu kontrol eder |

---

## 🔧 Notlar

- **Loglar konsolda renkli olarak gösterilir**: ✅ başarılı işlemler yeşil, ❌ başarısız işlemler kırmızı.
- Node.js ≥16 ve gerekli paketler kurulu olmalıdır.
- Bot, kanalları ve rolleri **orijinal sunucu sırasına uygun** şekilde kopyalar.
