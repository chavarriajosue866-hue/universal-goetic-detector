class RitualSubtitles {
    constructor(detector) {
        this.detector = detector;
        this.subtitleEl = document.getElementById('subtitles');
        this.recognition = null;
        this.isListening = false;
        this.hideTimeout = null;
        this.restartTimeout = null;
        this.currentText = ''; // Buffer para evitar glitch visual
        this.currentLang = 'es-ES';
        
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
        this.recognition.maxAlternatives = 1; // Reduce carga en el móvil

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

            // Actualizar buffer solo si hay texto final
            if (finalTranscript) {
                this.currentText += finalTranscript + ' ';
                // Evitar que el texto se desborde en la pantalla del móvil
                if (this.currentText.length > 120) {
                    this.currentText = this.currentText.substring(this.currentText.indexOf(' ') + 1);
                }
            }

            const displayText = this.currentText + interimTranscript;
            if (displayText.trim().length > 0) { 
                this.showSubtitle(displayText);
            }
        };

        // Filtrar errores falsos de móviles
        this.recognition.onerror = (event) => {
            // 'no-speech' y 'aborted' son normales en móvil, los ignoramos
            if (event.error === 'no-speech' || event.error === 'aborted') return;
            
            // Error de red (común en móviles), dejamos que onend lo reinicie
            if (event.error === 'network') {
                console.warn("Speech API network error, retrying...");
                return; 
            }
            console.error("Speech error:", event.error);
        };
        
        // Reinicio con retraso (CRUCIAL para móviles)
        this.recognition.onend = () => {
            if (this.isListening) {
                clearTimeout(this.restartTimeout);
                // Esperar 500ms antes de reiniciar para evitar bucles infinitos que crashean el navegador
                this.restartTimeout = setTimeout(() => {
                    try { this.recognition.start(); } catch (e) {}
                }, 500);
            }
        };
    }

    setLanguage(lang) {
        this.currentLang = lang;
        this.currentText = ''; // Limpiar buffer al cambiar idioma
        if (this.recognition) {
            this.recognition.lang = lang;
            if (this.isListening) {
                try { this.recognition.stop(); } catch(e){}
            }
        }
    }

    start() {
        if (!this.recognition) return;
        this.isListening = true;
        this.currentText = '';
        try { this.recognition.start(); } catch (e) {}
    }

    stop() {
        this.isListening = false;
        clearTimeout(this.restartTimeout);
        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }
        this.subtitleEl.classList.remove('active');
    }

    showSubtitle(text) {
        // Usar innerText en lugar de += para evitar duplicados visuales
        this.subtitleEl.innerText = text.trim().toUpperCase();
        this.subtitleEl.classList.add('active');
        
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            // Solo ocultar si no hay texto nuevo
            if (this.subtitleEl.innerText === text.trim().toUpperCase()) {
                this.subtitleEl.classList.remove('active');
            }
        }, 4000);
    }
}
