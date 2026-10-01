document.addEventListener('DOMContentLoaded', async () => {
    const detector = new GoetiaDetector();
    const ai = new GoetiaAI();
    const spectrogram = new RitualSpectrogram('spectrogram', detector, ai);
    const subtitles = new RitualSubtitles(detector);

    const startBtn = document.getElementById('startBtn');

    startBtn.addEventListener('click', async () => {
        if (detector.audioContext && detector.audioContext.state === 'running') {
            spectrogram.stop();
            subtitles.stop();
            startBtn.innerText = "Start Ritual";
            return;
        }

        await detector.init();
        await ai.loadModel();
        
        spectrogram.start();
        subtitles.start();
        startBtn.innerText = "Stop Ritual";
    });
});