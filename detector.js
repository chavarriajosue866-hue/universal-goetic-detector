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

        // Filtros anti-feedback ajustados para móviles
        this.highpass = this.audioContext.createBiquadFilter();
        this.highpass.type = 'highpass';
        this.highpass.frequency.value = 100; // Bajado de 500 a 100 para no cortar la voz

        this.noiseGate = this.audioContext.createDynamicsCompressor();
        this.noiseGate.threshold.value = -60; // Menos agresivo (antes -30)
        this.noiseGate.ratio.value = 4;       // Menos compresión
        this.noiseGate.attack.value = 0.003;
        this.noiseGate.release.value = 0.25;

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

