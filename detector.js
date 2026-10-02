class GoetiaDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.bandpass = null;
        this.outputBandpass = null;
        this.limiter = null;
        this.gainNode = null;
        this.noiseGainNode = null;
        this.audioStream = null;
        this.currentEnergy = 0;
        this.sweepDirection = 1;
        
        this.settings = {
            sweepEnabled: true,
            sweepSpeed: 10,
            noiseVolume: 0.10,
            outputGain: 8.0,
            minFreq: 400,
            maxFreq: 2500
        };
    }

    async init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        // RUTA 1: Análisis (Limpia para la IA y Espectrograma)
        this.bandpass = this.audioContext.createBiquadFilter();
        this.bandpass.type = 'bandpass';
        this.bandpass.frequency.value = 1500; 
        this.bandpass.Q.value = 0.4; 

        // RUTA 2: Salida de Audio (Spirit Box + Compresor EVP)
        this.outputBandpass = this.audioContext.createBiquadFilter();
        this.outputBandpass.type = 'bandpass';
        this.outputBandpass.frequency.value = 1000;
        this.outputBandpass.Q.value = 1.0;

        // NUEVO: Compresor de Rango Dinámico (Hace que los susurros suenen fuertes)
        this.evpCompressor = this.audioContext.createDynamicsCompressor();
        this.evpCompressor.threshold.value = -60; // Captura sonidos ultra-bajos
        this.evpCompressor.knee.value = 0;
        this.evpCompressor.ratio.value = 20;      // Aplasta la diferencia entre ruido y voz
        this.evpCompressor.attack.value = 0.001;
        this.evpCompressor.release.value = 0.1;

        // Ganancia extra para el modo sensible
        this.evpGain = this.audioContext.createGain();
        this.evpGain.gain.value = 1.0; // Se activará con el toggle

        this.limiter = this.audioContext.createDynamicsCompressor();
        this.limiter.threshold.value = -10;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.001;
        this.limiter.release.value = 0.01;

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.settings.outputGain;

        // Ruido Blanco
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
        
        this.whiteNoise = this.audioContext.createBufferSource();
        this.whiteNoise.buffer = noiseBuffer;
        this.whiteNoise.loop = true;
        
        this.noiseGainNode = this.audioContext.createGain();
        this.noiseGainNode.gain.value = this.settings.noiseVolume;

        this.audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
        });

        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        
        // Conexiones Ruta 1 (Análisis)
        source.connect(this.bandpass);
        this.bandpass.connect(this.analyser);
        
        // Conexiones Ruta 2 (Salida con Compresor EVP)
        source.connect(this.outputBandpass);
        this.whiteNoise.connect(this.noiseGainNode);
        this.noiseGainNode.connect(this.outputBandpass);
        
        this.outputBandpass.connect(this.evpCompressor);
        this.evpCompressor.connect(this.evpGain);
        this.evpGain.connect(this.gainNode);
        this.gainNode.connect(this.limiter);
        this.limiter.connect(this.audioContext.destination);

        this.whiteNoise.start();
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        if (this.gainNode) this.gainNode.gain.value = this.settings.outputGain;
        if (this.noiseGainNode) this.noiseGainNode.gain.value = this.settings.noiseVolume;
        
        // Lógica del Modo Ultra-Sensible
        if (this.evpGain) {
            // Si está activo, multiplica la ganancia base por 4 para amplificar susurros
            this.evpGain.gain.value = this.settings.evpMode ? 4.0 : 1.0;
        }
    }

    sweepFrequency() {
        if (!this.settings.sweepEnabled || !this.outputBandpass) return;
        
        const speed = this.settings.sweepSpeed;
        let currentFreq = this.outputBandpass.frequency.value;
        currentFreq += speed * this.sweepDirection;

        if (currentFreq >= this.settings.maxFreq) {
            currentFreq = this.settings.maxFreq;
            this.sweepDirection = -1;
        } else if (currentFreq <= this.settings.minFreq) {
            currentFreq = this.settings.minFreq;
            this.sweepDirection = 1;
        }

        this.outputBandpass.frequency.setValueAtTime(currentFreq, this.audioContext.currentTime);
    }

    updateEnergy(dataArray) {
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        this.currentEnergy = sum / dataArray.length;
    }
}
