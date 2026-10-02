class RitualSubtitles {
    constructor(detector) {
        this.detector = detector;
        this.subtitleEl = document.getElementById('subtitles');
        this.recognition = null;
        this.isListening = false;
        this.hideTimeout = null;
        this.currentLang = 'es-ES'; // Por defecto Español/Latín
        
        this.initSpeechAPI();
    }

    initSpeechAPI() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.subtitleEl.innerText = "ERROR: Speech API no soportada";
            this.subtitleEl.classList.add('active');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLang;

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript.trim().length > 0) { 
                this.showSubtitle(finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                console.error("Speech error:", event.error);
            }
        };
        
        this.recognition.onend = () => {
            if (this.isListening) {
                try { this.recognition.start(); } catch (e) {}
            }
        };
    }

    setLanguage(lang) {
        this.currentLang = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
            // Reiniciar para aplicar el nuevo idioma
            if (this.isListening) {
                try { this.recognition.stop(); } catch(e){}
                setTimeout(() => {
                    try { this.recognition.start(); } catch(e){}
                }, 300);
            }
        }
    }

    start() {
        if (!this.recognition) return;
        this.isListening = true;
        try { this.recognition.start(); } catch (e) {}
    }

    stop() {
        this.isListening = false;
        if (this.recognition) this.recognition.stop();
        this.subtitleEl.classList.remove('active');
    }

    showSubtitle(text) {
        this.subtitleEl.innerText = text.trim().toUpperCase();
        this.subtitleEl.classList.add('active');
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            this.subtitleEl.classList.remove('active');
        }, 4000);
    }
}
