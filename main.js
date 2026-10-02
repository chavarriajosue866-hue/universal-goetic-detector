document.addEventListener('DOMContentLoaded', async () => {
    const detector = new GoetiaDetector();
    const ai = new GoetiaAI();
    const spectrogram = new RitualSpectrogram('spectrogram', detector, ai);
    const subtitles = new RitualSubtitles(detector);

    const startBtn = document.getElementById('startBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettings = document.getElementById('closeSettings');

    startBtn.addEventListener('click', async () => {
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
        
        spectrogram.start();
        subtitles.start();
        startBtn.innerText = "Stop Ritual";
    });

    settingsBtn.addEventListener('click', () => settingsPanel.classList.remove('hidden'));
    closeSettings.addEventListener('click', () => settingsPanel.classList.add('hidden'));

    // Nuevo: Control del idioma
    document.getElementById('langSelect').addEventListener('change', (e) => {
        subtitles.setLanguage(e.target.value);
    });

    document.getElementById('sweepToggle').addEventListener('change', (e) => {
        detector.updateSettings({ sweepEnabled: e.target.checked });
    });

    document.getElementById('sweepSpeed').addEventListener('input', (e) => {
        detector.updateSettings({ sweepSpeed: parseInt(e.target.value) });
    });

    document.getElementById('noiseVol').addEventListener('input', (e) => {
        detector.updateSettings({ noiseVolume: parseInt(e.target.value) / 100 });
    });

    document.getElementById('outVol').addEventListener('input', (e) => {
        detector.updateSettings({ outputGain: parseInt(e.target.value) });
    });
        document.getElementById('evpMode').addEventListener('change', (e) => {
        detector.updateSettings({ evpMode: e.target.checked });
    });
});
