document.addEventListener('DOMContentLoaded', async () => {
    const detector = new GoetiaDetector();
    const ai = new GoetiaAI();
    const spectrogram = new RitualSpectrogram('spectrogram', detector, ai);
    const subtitles = new RitualSubtitles(detector);

    const startBtn = document.getElementById('startBtn');

    startBtn.addEventListener('click', async () => {
        // Forzar desbloqueo de audio en móviles
        if (detector.audioContext && detector.audioContext.state === 'suspended') {
            await detector.audioContext.resume();
        }

        if (detector.audioContext && detector.audioContext.state === 'running' && startBtn.innerText === "Stop Ritual") {
            spectrogram.stop();
            subtitles.stop();
            startBtn.innerText = "Start Ritual";
            return;
        }

        await detector.init();
        await ai.loadModel();
        
        // Forzar la salida de audio explícitamente
        if (detector.audioContext.state === 'running') {
             detector.bandpass.connect(detector.audioContext.destination);
        }

        spectrogram.start();
        subtitles.start();
        startBtn.innerText = "Stop Ritual";
    });
});
