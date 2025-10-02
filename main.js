const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const axios = require("axios")
//sonradan eklediğim modüller


const { Client } = require("discord.js-selfbot-v13");
const {
  JsonDatabase,
} = require("wio.db");

const db = new JsonDatabase({
databasePath:"./database.json"
});

const { BOT } = require("./Config")

const client = new Client({
  checkUpdate: false,
});
exports.client = client;

  client.on("ready", () => {
    console.log(`${client.user.tag} giriş yaptı!`);

    // Burada durumu ayarlayabilirsin
    client.user.setActivity("Burakrhyme Project!", { type: "WATCHING" }); // Oynuyor izliyor dinliyor vs yapmak için büyük harflerle ingilizcesini yaz PLAYING WATCHING LISTINIG
    client.user.setStatus("idle"); // Online dnd idle vs.
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const configPath = path.join(__dirname, "./Config.js");

client.login(BOT.token);
client.setMaxListeners(30);

//server clonner

async function safeSend(channelOrUser, content) {
  try {
    if (channelOrUser?.send) await channelOrUser.send(content);
    else {
      const owner = await client.users.fetch(BOT.owners[0]).catch(() => null);
      if (owner) await owner.send(content).catch(() => {});
    }
  } catch (e) { console.warn("safeSend fail:", e?.message); }
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT ${label || ""}`)), ms))
  ]);
}

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!kanalkopyala")) return;
  if (!BOT.owners.includes(message.author.id)) {
    return safeSend(message.channel, "🚫 Bu komutu kullanmaya yetkin yok!");
  }

  const parts = message.content.split(" ").filter(Boolean);
  const sourceId = parts[1], targetId = parts[2];
  if (!sourceId || !targetId) {
    return safeSend(message.channel, "⚠️ Kullanım: `!kanalkopyala <kaynakGuildID> <hedefGuildID>`");
  }

  const sourceGuild = client.guilds.cache.get(sourceId) || await client.guilds.fetch(sourceId).catch(() => null);
  const targetGuild = client.guilds.cache.get(targetId) || await client.guilds.fetch(targetId).catch(() => null);
  if (!sourceGuild || !targetGuild) return safeSend(message.channel, "❌ Kaynak veya hedef sunucu bulunamadı.");

  let failedRoles = [], failedCategories = [], failedChannels = [];
  let lastAction = "Başlamadı";

  try {
    console.log(chalk.blue(`💣 [START] Kopyalama: ${sourceGuild.name} -> ${targetGuild.name}`));

    // Kanalları silme
    lastAction = "Kanalları silme";
    const targetChannels = Array.from(targetGuild.channels.cache.values()).sort((a,b) => b.rawPosition - a.rawPosition);
    for (const ch of targetChannels) {
      try { await withTimeout(ch.delete(`Nuke by ${message.author.tag}`), 15000, `delete-channel ${ch.id}`); 
        console.log(chalk.green(`✅ Kanal silindi: ${ch.name}`)); 
      } catch (err) { failedChannels.push(`❌ ${ch.name} (${err.message})`); console.log(chalk.red(`❌ Kanal silinemedi: ${ch.name} (${err.message})`)); }
      await sleep(5000);
    }

    // Rolleri silme
    lastAction = "Rolleri silme";
    const targetRoles = Array.from(targetGuild.roles.cache.values())
      .filter(r => r.id !== targetGuild.id)
      .sort((a,b) => b.position - a.position);
    for (const rl of targetRoles) {
      try { await withTimeout(rl.delete(`Nuke by ${message.author.tag}`), 15000, `delete-role ${rl.id}`); 
        console.log(chalk.green(`✅ Rol silindi: ${rl.name}`)); 
      } catch (err) { failedRoles.push(`❌ ${rl.name} (${err.message})`); console.log(chalk.red(`❌ Rol silinemedi: ${rl.name} (${err.message})`)); }
      await sleep(5000);
    }

    // Sunucu adı/ikon
    lastAction = "Sunucu adı/ikon kopyalama";
    try { await withTimeout(targetGuild.setName(sourceGuild.name), 10000, "setName"); } catch(e) {}
    if (sourceGuild.iconURL()) {
      try {
        const res = await fetch(sourceGuild.iconURL({ dynamic:true, size:4096 })).catch(()=>null);
        if (res && res.ok) await withTimeout(targetGuild.setIcon(await res.buffer()), 15000, "setIcon");
      } catch(e) {}
    }
    console.log(chalk.green("✅ Sunucu adı ve ikon kopyalandı"));
    await sleep(3000);

    // Rolleri kopyalama
    lastAction = "Rolleri kopyalama";
    const sourceRoles = Array.from(sourceGuild.roles.cache.values())
      .filter(r => !r.managed && r.id !== sourceGuild.id)
      .sort((a,b) => b.position - a.position);
    for (const role of sourceRoles) {
      try {
        const newRole = await withTimeout(targetGuild.roles.create({
          name: role.name, color: role.color, hoist: role.hoist,
          permissions: role.permissions, mentionable: role.mentionable,
          reason: "Sunucu yedekleme"
        }), 20000, `create-role ${role.id}`);
        try { await withTimeout(newRole.setPosition(role.position), 10000, `setPosition-role ${newRole.id}`); } catch(e){}
        console.log(chalk.green(`✅ Rol oluşturuldu: ${role.name}`));
      } catch (err) { failedRoles.push(`❌ ${role.name} (${err.message})`); console.log(chalk.red(`❌ Rol oluşturulamadı: ${role.name} (${err.message})`)); }
      await sleep(5000);
    }

    // Kategorileri kopyalama
    lastAction = "Kategorileri kopyalama";
    const categoryMap = new Map();
    const sourceCategories = Array.from(sourceGuild.channels.cache.values())
      .filter(c=>c.type==="GUILD_CATEGORY")
      .sort((a,b)=>a.rawPosition-b.rawPosition);
    for (const cat of sourceCategories) {
      try {
        const newCat = await withTimeout(targetGuild.channels.create(cat.name,{
          type:"GUILD_CATEGORY"
        }),15000,`create-category ${cat.id}`);
        try { await withTimeout(newCat.setPosition(cat.rawPosition),10000,`setPosition-cat ${newCat.id}`); } catch(e){}
        categoryMap.set(cat.id,newCat.id);
        console.log(chalk.green(`✅ Kategori oluşturuldu: ${cat.name}`));
      } catch(err){ failedCategories.push(`❌ ${cat.name} (${err.message})`); console.log(chalk.red(`❌ Kategori oluşturulamadı: ${cat.name} (${err.message})`)); }
      await sleep(5000);
    }

    // Kanalları kopyalama
    lastAction = "Kanalları kopyalama";
    const sourceChannels = Array.from(sourceGuild.channels.cache.values())
      .filter(c=>c.type!=="GUILD_CATEGORY")
      .sort((a,b)=>a.rawPosition-b.rawPosition);
    for(const ch of sourceChannels){
      try{
        const opts={ type:ch.type, topic:ch.topic||null, nsfw:ch.nsfw||false,
          rateLimitPerUser:ch.rateLimitPerUser||0 };
        if(ch.parentId && categoryMap.has(ch.parentId)) opts.parent = categoryMap.get(ch.parentId);
        const newCh = await withTimeout(targetGuild.channels.create(ch.name,opts),20000,`create-channel ${ch.id}`);
        try{ await withTimeout(newCh.setPosition(ch.rawPosition),10000,`setPosition-ch ${newCh.id}`);} catch(e){}
        console.log(chalk.green(`✅ Kanal oluşturuldu: ${ch.name}`));
      } catch(err){ failedChannels.push(`❌ ${ch.name} (${err.message})`); console.log(chalk.red(`❌ Kanal oluşturulamadı: ${ch.name} (${err.message})`)); }
      await sleep(5000);
    }

    // İşlem tamam mesajı
    await safeSend(message.channel,"🚀 Yedekleme tamamlandı! ✅");

    // Owner DM raporu
    const ownerUser = await client.users.fetch(message.author.id).catch(()=>null);
    let report="📋 **Yedekleme Raporu**\n\n";
    if(failedRoles.length) report+=failedRoles.join("\n")+"\n";
    if(failedCategories.length) report+=failedCategories.join("\n")+"\n";
    if(failedChannels.length) report+=failedChannels.join("\n")+"\n";
    if(!failedRoles.length && !failedCategories.length && !failedChannels.length) report+="✅ Hiç hata yok, tüm öğeler başarıyla kopyalandı.";
    if(ownerUser) await ownerUser.send(report).catch(()=>{});

    console.log(chalk.blue("✅ İşlem tamamlandı. Son adım:", lastAction));
  } catch(err){
    console.error(chalk.red("!kanalkopyala top-level hata:"), err, "Son adım:", lastAction);
    await safeSend(message.channel, `⚠️ Yedekleme sırasında beklenmeyen bir hata oluştu. Son adım: ${lastAction}\nHata: ${err.message}`);
  }
});


// owner ekleme komutu

// config dosya yolu (main dosyana göre ayarla)

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!sahipekle")) return;

  // Sadece mevcut ownerlar kullanabilir
  if (!BOT.owners.includes(message.author.id)) {
    return message.channel.send("❌ Bu komutu kullanmaya yetkiniz yok!");
  }

  // Mesajı sil (selfbot)
  await message.delete().catch(() => {});

  const parts = message.content.split(" ").filter(Boolean);
  const newOwnerId = parts[1]?.replace(/[<@!>]/g, ""); // mention varsa ID’ye çevir

  if (!newOwnerId || isNaN(newOwnerId)) {
    return message.channel.send("❌ Lütfen geçerli bir kullanıcı ID’si girin. Örnek: `!sahipekle 123456789012345678`");
  }

  if (BOT.owners.includes(newOwnerId)) {
    return message.channel.send("⚠️ Bu kullanıcı zaten owner listesinde!");
  }

  // Runtime array'e ekle
  BOT.owners.push(newOwnerId);

  try {
    // Cache temizle, config'i güncel olarak al
    delete require.cache[require.resolve(configPath)];
    let configData = require(configPath);

    if (!configData.BOT.owners.includes(newOwnerId)) {
      configData.BOT.owners.push(newOwnerId);

      // Config dosyasına yaz (kalıcı)
      fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(configData, null, 2) + ";", "utf8");
    }

    message.channel.send(`✅ Kullanıcı ID ${newOwnerId} owner olarak eklendi ve kaydedildi!`);
  } catch (err) {
    console.error("Config güncellenirken hata:", err);
    message.channel.send("⚠️ Config güncellenirken bir hata oluştu!");
  }
});


//owner silme komutu

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!sahipsil")) return;

  // Sadece owner kullanabilir
  if (!BOT.owners.includes(message.author.id)) {
    return message.channel.send("❌ Bu komutu kullanmaya yetkiniz yok!");
  }

  // Mesajı sil (selfbot)
  await message.delete().catch(() => {});

  const parts = message.content.split(" ").filter(Boolean);
  const removeId = parts[1]?.replace(/[<@!>]/g, "");

  if (!removeId || isNaN(removeId)) {
    return message.channel.send("❌ Lütfen geçerli bir kullanıcı ID’si girin. Örnek: `!sahipsil 123456789012345678`");
  }

  // Cache temizle ve config’i al
  delete require.cache[require.resolve(configPath)];
  const configData = require(configPath);

  if (!configData.BOT.owners.includes(removeId)) {
    return message.channel.send("⚠️ Bu kullanıcı zaten owner listesinde yok!");
  }

  // Config array’inden sil
  configData.BOT.owners = configData.BOT.owners.filter(id => id !== removeId);

  // Dosyaya yaz (kalıcı)
  fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(configData, null, 2) + ";", "utf8");

  // Runtime array’i güncelle
  BOT.owners = BOT.owners.filter(id => id !== removeId);

  message.channel.send(`✅ Kullanıcı ID ${removeId} owner listesinden silindi!`);
});




// ownerları görüntüleme 

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!owners")) return;

  // Opsiyonel: sadece owner görebilsin
  if (!BOT.owners.includes(message.author.id)) {
    return message.channel.send("❌ Bu komutu kullanmaya yetkiniz yok!");
  }

  // Mesajı sil (selfbot)
  await message.delete().catch(() => {});

  if (!BOT.owners || BOT.owners.length === 0) {
    return message.channel.send("⚠️ Henüz hiçbir owner eklenmemiş.");
  }

  // Owner ID’lerini mention’a çevir
  const mentions = BOT.owners.map(id => `<@${id}>`).join("\n");

  message.channel.send(`👑 Sahipler:\n${mentions}`);
});

//ping komutu 

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!ping")) return;

  // Mesajı sil (selfbot)
  await message.delete().catch(() => {});

  const start = Date.now();
  const msg = await message.channel.send("🏓 Pong...");
  const latency = Date.now() - start;

  // Mesajı editleyelim latency ile
  msg.edit(`🏓 Pong! Gecikme: ${latency}ms`);
});



const express = require('express');
const { channel } = require("diagnostics_channel");
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Power By Burakrhyme'));

app.listen(port, () =>
    console.log(`Bot bu adres üzerinde çalışıyor: http://localhost:${port}`)
);

