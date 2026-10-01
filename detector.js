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

        this.highpass = this.audioContext.createBiquadFilter();
        this.highpass.type = 'highpass';
        this.highpass.frequency.value = 100; 

        this.noiseGate = this.audioContext.createDynamicsCompressor();
        this.noiseGate.threshold.value = -50; // Ajustado para ambiente
        this.noiseGate.ratio.value = 6;
        this.noiseGate.attack.value = 0.003;
        this.noiseGate.release.value = 0.25;

        // NUEVO: Nodo de ganancia para amplificar el altavoz
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 3.0; // Amplifica el volumen de salida (ajusta si es mucho)

        this.audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
        });

        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        
        // Ruta de análisis (siempre completa)
        source.connect(this.bandpass);
        this.bandpass.connect(this.analyser);
        
        // Ruta de salida a altavoces (con filtros y ganancia)
        this.bandpass.connect(this.highpass);
        this.highpass.connect(this.noiseGate);
        this.noiseGate.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
    }
 }

