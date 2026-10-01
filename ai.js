class GoetiaAI {
    constructor() {
        this.model = null;
        this.audioBuffer = [];
    }

    async loadModel() {
        try {
            // Replace with your actual hosted model URL or local path
            this.model = await tf.loadLayersModel('web_model/model.json');
            console.log("AI Model loaded.");
        } catch (e) {
            console.warn("AI Model not found. Running in fallback mode.", e);
        }
    }

    async analyze(dataArray) {
        if (!this.model) return 0;

        this.audioBuffer.push(...dataArray);
        
        if (this.audioBuffer.length >= 44100) {
            const tensor = tf.tidy(() => {
                const data = tf.tensor1d(this.audioBuffer.slice(0, 4000));
                return data.reshape([1, 40, 100, 1]).div(255.0);
            });

            const prediction = this.model.predict(tensor);
            const scores = await prediction.data();
            tf.dispose([tensor, prediction]);
            
            this.audioBuffer = [];
            return scores[2]; // Index 2 is 'psicofonias_entidades'
        }
        return 0;
    }
}