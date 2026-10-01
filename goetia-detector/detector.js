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

        // Filtro universal amplio (300Hz - 3400Hz aprox)
        this.bandpass = this.audioContext.createBiquadFilter();
        this.bandpass.type = 'bandpass';
        this.bandpass.frequency.value = 1500; 
        this.bandpass.Q.value = 0.4; // Ancho para captar cualquier voz

        this.audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
        });

        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        source.connect(this.bandpass);
        this.bandpass.connect(this.analyser);
    }

    updateEnergy(dataArray) {
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        this.currentEnergy = sum / dataArray.length;
    }
}