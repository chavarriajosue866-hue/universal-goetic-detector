class RitualSubtitles {
    constructor(detector) {
        this.detector = detector;
        this.subtitleEl = document.getElementById('subtitles');
        this.recognition = null;
        this.isListening = false;
        this.hideTimeout = null;
        
        this.initSpeechAPI();
    }

    initSpeechAPI() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US'; // Cambia a 'es-ES' si prefieres español

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            const text = finalTranscript || interimTranscript;
            
            // Solo mostrar si hay energía anómala en el audio (psicofonía)
            if (text && this.detector.currentEnergy > 30) { 
                this.showSubtitle(text);
            }
        };

        this.recognition.onerror = (event) => console.error("Speech error:", event.error);
        
        this.recognition.onend = () => {
            if (this.isListening) this.recognition.start(); // Reiniciar si se detiene
        };
    }

    start() {
        if (!this.recognition) return;
        this.isListening = true;
        try {
            this.recognition.start();
        } catch (e) {
            console.log("Already listening");
        }
    }

    stop() {
        this.isListening = false;
        if (this.recognition) this.recognition.stop();
        this.subtitleEl.classList.remove('active');
    }

    showSubtitle(text) {
        this.subtitleEl.innerText = text.toUpperCase();
        this.subtitleEl.classList.add('active');
        
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            this.subtitleEl.classList.remove('active');
        }, 3000);
    }
}