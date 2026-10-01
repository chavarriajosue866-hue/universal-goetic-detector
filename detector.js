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

        this.bandpass = this.audioContext.createBiquadFilter();
        this.bandpass.type = 'bandpass';
        this.bandpass.frequency.value = 1500; 
        this.bandpass.Q.value = 0.4; 

        this.outputBandpass = this.audioContext.createBiquadFilter();
        this.outputBandpass.type = 'bandpass';
        this.outputBandpass.frequency.value = 1000;
        this.outputBandpass.Q.value = 1.0;

        this.limiter = this.audioContext.createDynamicsCompressor();
        this.limiter.threshold.value = -10;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.001;
        this.limiter.release.value = 0.01;

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.settings.outputGain;

        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        this.whiteNoise = this.audioContext.createBufferSource();
        this.whiteNoise.buffer = noiseBuffer;
        this.whiteNoise.loop = true;
        
        this.noiseGainNode = this.audioContext.createGain();
        this.noiseGainNode.gain.value = this.settings.noiseVolume;

        this.audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
        });

        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        
        source.connect(this.bandpass);
        this.bandpass.connect(this.analyser);
        
        source.connect(this.outputBandpass);
        this.whiteNoise.connect(this.noiseGainNode);
        this.noiseGainNode.connect(this.outputBandpass);
        
        this.outputBandpass.connect(this.gainNode);
        this.gainNode.connect(this.limiter);
        this.limiter.connect(this.audioContext.destination);

        this.whiteNoise.start();
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        if (this.gainNode) this.gainNode.gain.value = this.settings.outputGain;
        if (this.noiseGainNode) this.noiseGainNode.gain.value = this.settings.noiseVolume;
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
