const mongoose = require("mongoose");
const allah = require("../config.json");

// strictQuery ayarı v7/v8 sürümlerinde varsayılan olarak zaten aktiftir, 
// ancak kalmasında bir sakınca yok.
mongoose.set('strictQuery', true);

// DÜZELTME: useNewUrlParser ve useUnifiedTopology artık Mongoose tarafından desteklenmiyor ve kaldırıldı.
// Bunları sildik ve olası ilk bağlantı hatalarını yakalamak için .catch() ekledik.
mongoose.connect(allah.mongoUrl)
  .catch(err => {
    console.error("[KRİTİK HATA] MongoDB'ye ilk bağlantı sırasında hata oluştu:", err.message);
  });

// Bağlantı başarılı olduğunda tetiklenir
mongoose.connection.on("connected", () => {
  console.log("Database bağlantısı tamamlandı!");
});

// Bağlantı açıldıktan sonra bir hata oluşursa tetiklenir
mongoose.connection.on("error", (err) => {
  console.error("[HATA] Database bağlantısında bir sorun yaşandı:", err.message);
});

// Sunucu bağlantısı koptuğunda haberdar olmak için (Opsiyonel ama faydalı)
mongoose.connection.on("disconnected", () => {
  console.warn("[UYARI] Database bağlantısı koptu! Yeniden bağlanılmaya çalışılıyor...");
});