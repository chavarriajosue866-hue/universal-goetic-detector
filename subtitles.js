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
        
        // DIAGNÓSTICO 1: ¿Existe la API?
        if (!SpeechRecognition) {
            this.subtitleEl.innerText = "ERROR: Tu navegador no soporta Web Speech API";
            this.subtitleEl.classList.add('active');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US'; 

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

        // DIAGNÓSTICO 2: Errores de la API
        this.recognition.onerror = (event) => {
            let msg = `ERROR SPEECH: ${event.error}`;
            if (event.error === 'no-speech') msg = "No se escuchó nada (ajusta volumen)";
            if (event.error === 'audio-capture') msg = "ERROR: No se encuentra micrófono";
            if (event.error === 'not-allowed') msg = "ERROR: Permiso de micrófono denegado";
            
            this.subtitleEl.innerText = msg;
            this.subtitleEl.classList.add('active');
            console.error("Speech Error:", event.error);
        };
        
        this.recognition.onstart = () => {
            this.subtitleEl.innerText = "ESCUCHANDO...";
            this.subtitleEl.classList.add('active');
            setTimeout(() => this.subtitleEl.classList.remove('active'), 2000);
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                try { this.recognition.start(); } catch (e) {}
            }
        };
    }

    start() {
        if (!this.recognition) return;
        this.isListening = true;
        try { 
            this.recognition.start(); 
        } catch (e) {
            this.subtitleEl.innerText = "ERROR AL INICIAR: " + e.message;
            this.subtitleEl.classList.add('active');
        }
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
