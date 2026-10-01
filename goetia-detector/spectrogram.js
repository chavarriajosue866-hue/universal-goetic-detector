class RitualSpectrogram {
    constructor(canvasId, detector, ai) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.detector = detector;
        this.ai = ai;
        this.isRunning = false;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        this.isRunning = true;
        this.draw();
    }

    stop() {
        this.isRunning = false;
    }

    async draw() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.draw());

        const bufferLength = this.detector.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.detector.analyser.getByteFrequencyData(dataArray);
        
        // Actualizar energía para los subtítulos
        this.detector.updateEnergy(dataArray);

        const width = this.canvas.width;
        const height = this.canvas.height;

        const imageData = this.ctx.getImageData(1, 0, width - 1, height);
        this.ctx.putImageData(imageData, 0, 0);

        for (let i = 0; i < height; i++) {
            const value = dataArray[Math.floor((i / height) * bufferLength)];
            const intensity = value / 255;
            
            const r = Math.floor(intensity * 255);
            const g = Math.floor((1 - intensity) * 50);
            const b = Math.floor((1 - intensity) * 255);
            
            this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            this.ctx.fillRect(width - 1, height - i, 1, 1);
        }

        const entityProb = await this.ai.analyze(dataArray);
        const statusEl = document.getElementById('status');
        if (entityProb > 0.85 || this.detector.currentEnergy > 80) {
            statusEl.innerText = "ANOMALY DETECTED";
            statusEl.style.color = "#00ff00";
        } else {
            statusEl.innerText = "Listening...";
            statusEl.style.color = "#ff4444";
        }
    }
}