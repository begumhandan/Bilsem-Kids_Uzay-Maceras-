🚀 Uzay Macerası (BİLSEM Kids)

Link:https://bilsem-cocuk.netlify.app/

Bu proje, 5–6 yaş arası çocukların BİLSEM sınavlarına hazırlanmasına yardımcı olmak için geliştirdiğim etkileşimli bir web uygulamasıdır.
Tüm içerikleri — karakterler, seslendirmeler, görseller ve yapay zekâ özellikleri — Google AI Studio ve Gemini 2.5 modellerini kullanarak oluşturdum.

Uygulama tamamen çocuğa uygun, sesli yönlendirmeli, renkli ve eğlenceli bir deneyim sunar.

✨ Özellikler
🧠 BİLSEM Tarzı Eğitim Oyunları

Okuma yazma bilmeyen çocuklar için uygun olarak toplam 6 oyun modülü geliştirdim:

Dikkat: Şekil/renk bulma

Örüntü: Mantıksal diziyi tamamlama

Gölge: Nesne–gölge eşleştirme

Puzzle: Resmin eksik parçasını bulma

Hafıza: Görsel hafızayı ölçme

Benzeşim: Nesneler arasındaki ilişkiyi bulma

Tüm yönergeler sesli olarak verilir.

🤖 Robo – Canlı Sesli Asistan

Uygulamanın içine bir de sesli asistan ekledim:

Google Gemini Live API ile gerçek zamanlı konuşma

Çocuğa sorular soruyor, yönlendirme yapıyor

Çok düşük gecikmeli, doğal bir konuşma deneyimi

🔊 Sesli Geri Bildirim

Google AI Studio’nun TTS modeliyle oluşturdum:

“Aferin!”

“Tekrar dene!”

“Hadi bir sonraki soruya geçelim!”

Tümü minik kullanıcılar için tasarlanmış doğal Türkçe seslerdir.

🛠️ Teknolojiler

React 19 + TypeScript + Tailwind CSS

Google Gemini API (AI, TTS, Image, Live)

Web Audio API

Vite

🤖 Kullandığım Gemini Modelleri
Özellik Model Açıklama
Seslendirme gemini-2.5-flash-preview-tts Çocuklara uygun Türkçe sesler
Boyama sayfası üretimi gemini-2.5-flash-image Siyah-beyaz çizimler
Canlı asistan gemini-2.5-flash-native-audio-preview Gerçek zamanlı konuşma
Genel işlemler gemini-2.5-flash Ek analizler ve işleme
🚀 Kurulum

1. Projeyi klonla
   git clone https://github.com/yourusername/uzay-macerasi.git
   cd uzay-macerasi

2. Bağımlılıkları yükle
   npm install

3. Ortam değişkeni oluştur

Proje kökünde .env dosyası aç:

API_KEY=your_google_gemini_api_key_here

4. Uygulamayı çalıştır
   npm start

📂 Proje Yapısı
src/
App.tsx # Ana yapı
components/ # Oyun modülleri ve UI
services/
gemini.ts # TTS, Image, Live API işlemleri
audioUtils.ts # Ses işleyici
public/
assets/ # AI ile oluşturulan görseller
README.md

🎮 Nasıl Oynanır?

Menüden bir gezegen (oyun) seçilir.

Robo ya da uygulama yönergeyi sesli verir.

Çocuk doğru görsele dokunur.

Başarı durumunda yıldız kazanır.

Boyama bölümünde kendi çizimlerini oluşturup boyayabilir.

📄 Lisans

MIT Lisansı ile yayınlanmıştır.
