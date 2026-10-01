class GoetiaDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.bandpass = null; // Para análisis (estático)
        this.outputBandpass = null; // Para altavoces (barrido)
        this.limiter = null;
        this.gainNode = null;
        this.audioStream = null;
        this.currentEnergy = 0;
        this.sweepDirection = 1;
    }

    async init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        // 1. Filtro para la IA (Estático, no se mueve)
        this.bandpass = this.audioContext.createBiquadFilter();
        this.bandpass.type = 'bandpass';
        this.bandpass.frequency.value = 1500; 
        this.bandpass.Q.value = 0.4; 

        // 2. Filtro para el Altavoz (Barrido Spirit Box)
        this.outputBandpass = this.audioContext.createBiquadFilter();
        this.outputBandpass.type = 'bandpass';
        this.outputBandpass.frequency.value = 1000;
        this.outputBandpass.Q.value = 2.0; // Más enfocado para el barrido

        // 3. Limitador (Evita el pitido y la distorsión al máximo volumen)
        this.limiter = this.audioContext.createDynamicsCompressor();
        this.limiter.threshold.value = -10;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.001;
        this.limiter.release.value = 0.01;

        // 4. Ganancia alta (Volumen)
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 15.0; // Volumen muy alto, protegido por el limitador

        // 5. Generador de Ruido Blanco (Estática de Spirit Box)
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        this.whiteNoise = this.audioContext.createBufferSource();
        this.whiteNoise.buffer = noiseBuffer;
        this.whiteNoise.loop = true;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.value = 0.15; // Volumen de la estática (ajusta si quieres más o menos)

        // Captura del micrófono
        this.audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
        });

        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        
        // RUTA A: Análisis (IA, Espectrograma, Subtítulos)
        source.connect(this.bandpass);
        this.bandpass.connect(this.analyser);
        
        // RUTA B: Salida Spirit Box (Micrófono + Ruido Blanco -> Barrido -> Ganancia -> Limitador)
        source.connect(this.outputBandpass);
        this.whiteNoise.connect(noiseGain);
        noiseGain.connect(this.outputBandpass);
        
        this.outputBandpass.connect(this.gainNode);
        this.gainNode.connect(this.limiter);
        this.limiter.connect(this.audioContext.destination);

        // Iniciar ruido blanco
        this.whiteNoise.start();
    }

    // Lógica de barrido de frecuencias (Rompe el feedback)
    sweepFrequency() {
        if (!this.outputBandpass) return;
        
        const minFreq = 500;
        const maxFreq = 3000;
        const speed = 50; // Velocidad del barrido en Hz por frame

        let currentFreq = this.outputBandpass.frequency.value;
        currentFreq += speed * this.sweepDirection;

        if (currentFreq >= maxFreq) {
            currentFreq = maxFreq;
            this.sweepDirection = -1;
        } else if (currentFreq <= minFreq) {
            currentFreq = minFreq;
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
