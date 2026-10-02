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
            console.error("Web Speech API no disponible");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        // Usamos en-US porque su modelo fonético es más "agresivo" 
        // para mapear sonidos raros o desconocidos a palabras.
        this.recognition.lang = 'en-US'; 

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
            
            // ELIMINADO EL FILTRO DE ENERGÍA: Muestra TODO lo que la API crea escuchar.
            if (text.trim().length > 0) { 
                this.showSubtitle(text);
            }
        };

        this.recognition.onerror = (event) => {
            console.error("Speech error:", event.error);
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
        try { this.recognition.start(); } catch (e) {}
    }

    stop() {
        this.isListening = false;
        if (this.recognition) this.recognition.stop();
        this.subtitleEl.classList.remove('active');
    }

    showSubtitle(text) {
        // Muestra el texto tal cual la API lo interpreta fonéticamente
        this.subtitleEl.innerText = text.trim().toUpperCase();
        this.subtitleEl.classList.add('active');
        
        clearTimeout(this.hideTimeout);
        // Lo dejamos un poco más tiempo en pantalla para que alcances a leerlo
        this.hideTimeout = setTimeout(() => {
            this.subtitleEl.classList.remove('active');
        }, 4000);
    }
}
