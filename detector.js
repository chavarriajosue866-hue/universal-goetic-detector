class GoetiaDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.bandpass = null;
        this.audioStream = null;
        this.currentEnergy = 0; // Para sincronizar con subtítulos
    }

        async init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        this.bandpass = this.audioContext.createBiquadFilter();
        this.bandpass.type = 'bandpass';
        this.bandpass.frequency.value = 1500; 
        this.bandpass.Q.value = 0.4; 

        // Filtros anti-feedback para altavoces
        this.highpass = this.audioContext.createBiquadFilter();
        this.highpass.type = 'highpass';
        this.highpass.frequency.value = 500; // Elimina los graves que causan el acople

        this.noiseGate = this.audioContext.createDynamicsCompressor();
        this.noiseGate.threshold.value = -30; // Solo deja pasar sonidos fuertes
        this.noiseGate.ratio.value = 12;
        this.noiseGate.attack.value = 0.003;
        this.noiseGate.release.value = 0.1;

        this.audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
        });

        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        
        // Ruta de análisis
        source.connect(this.bandpass);
        this.bandpass.connect(this.analyser);
        
        // Ruta de salida a altavoces (con anti-feedback)
        this.bandpass.connect(this.highpass);
        this.highpass.connect(this.noiseGate);
        this.noiseGate.connect(this.audioContext.destination);
        }
    }
}
