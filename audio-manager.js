// 🎵 Audio Manager - مدير الصوتيات
class AudioManager {
  constructor() {
    this.backgroundMusic = null;
    this.isMuted = false;
    this.volume = 0.3; // مستوى الصوت الافتراضي
    this.createAudioElements();
  }

  createAudioElements() {
    // إنشاء عنصر الموسيقى الخلفية
    this.backgroundMusic = new Audio();
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = this.volume;
    
    // موسيقى خلفية ناعمة (تم تحويلها إلى Data URI)
    this.backgroundMusic.src = this.generateBackgroundMusic();
  }

  // توليد موسيقى خلفية باستخدام Web Audio API
  generateBackgroundMusic() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 8; // 8 ثوان
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // نمط موسيقي بسيط
    const frequencies = [440, 494, 523, 587]; // نوتات موسيقية
    for (let i = 0; i < data.length; i++) {
      const freq = frequencies[Math.floor(i / (audioContext.sampleRate * 2)) % frequencies.length];
      data[i] = Math.sin((2 * Math.PI * freq * i) / audioContext.sampleRate) * 0.1;
    }

    // تحويل الـ buffer إلى blob ثم إلى URL
    const blob = new Blob([this.bufferToWave(buffer)], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  bufferToWave(buffer) {
    const channelData = buffer.getChannelData(0);
    const wavData = this.encodeWAV(channelData, buffer.sampleRate);
    return wavData.buffer;
  }

  encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const floatTo16BitPCM = (output, offset, input) => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);

    return new Uint8Array(buffer);
  }

  // تشغيل الموسيقى الخلفية
  playBackgroundMusic() {
    if (!this.isMuted && this.backgroundMusic) {
      this.backgroundMusic.play().catch(() => {
        // إذا فشل التشغيل التلقائي، يمكن للمستخدم بدء التشغيل يدوياً
      });
    }
  }

  // إيقاف الموسيقى الخلفية
  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  // تأثير صوتي عند الضغط على الزر
  playButtonClick() {
    this.playTone(800, 0.1, 0.1); // تردد عالي لفترة قصيرة
  }

  // تأثير صوتي للإجابة الصحيحة
  playCorrectAnswer() {
    // سلسلة من النوتات الصعودية
    this.playTone(523, 0.15, 0.1);
    setTimeout(() => this.playTone(659, 0.15, 0.1), 150);
    setTimeout(() => this.playTone(784, 0.15, 0.15), 300);
  }

  // تأثير صوتي للإجابة الخاطئة
  playWrongAnswer() {
    // نوتتان منخفضتان
    this.playTone(300, 0.2, 0.2);
    setTimeout(() => this.playTone(250, 0.2, 0.2), 150);
  }

  // تأثير صوتي لتنقل الصفحات
  playPageTransition() {
    this.playTone(600, 0.1, 0.05);
    setTimeout(() => this.playTone(700, 0.1, 0.05), 80);
  }

  // توليد نوتة موسيقية باستخدام Web Audio API
  playTone(frequency, volume, duration) {
    if (this.isMuted) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      // في حالة عدم دعم Web Audio API
    }
  }

  // تبديل الصوت
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
    return this.isMuted;
  }

  // تعديل مستوى الصوت
  setVolume(level) {
    this.volume = Math.max(0, Math.min(1, level));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.volume;
    }
  }
}

// إنشاء مثيل من مدير الصوت
const audioManager = new AudioManager();

// بدء تشغيل الموسيقى عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  audioManager.playBackgroundMusic();
  
  // السماح للمستخدم بالمحاولة بعد أي تفاعل
  document.addEventListener('click', () => {
    audioManager.playBackgroundMusic();
  }, { once: true });
});