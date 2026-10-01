import os
import numpy as np
import librosa
import tensorflow as tf
from tensorflow.keras import layers, models

def extract_features(audio_path, max_pad_len=100):
    audio, sr = librosa.load(audio_path, sr=22050, duration=3)
    mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)
    pad_width = max_pad_len - mfccs.shape[1]
    if pad_width > 0:
        mfccs = np.pad(mfccs, pad_width=((0, 0), (0, pad_width)))
    else:
        mfccs = mfccs[:, :max_pad_len]
    return mfccs

X, y = [], []
labels = {'ruido': 0, 'voces_humanas': 1, 'psicofonias_entidades': 2}

for folder, label_id in labels.items():
    path = f"dataset/{folder}"
    if os.path.exists(path):
        for file in os.listdir(path):
            if file.endswith('.wav'):
                features = extract_features(f"{path}/{file}")
                X.append(features)
                y.append(label_id)

if len(X) > 0:
    X = np.array(X)[..., np.newaxis]
    y = tf.keras.utils.to_categorical(y, 3)

    model = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(40, 100, 1)),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Flatten(),
        layers.Dense(64, activation='relu'),
        layers.Dense(3, activation='softmax')
    ])

    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(X, y, epochs=15, batch_size=16, validation_split=0.2)
    
    model.save('modelo_goetia_tf')
    # Run this in terminal to convert: tensorflowjs_converter --input_format keras modelo_goetia_tf web_model/
else:
    print("No dataset found. Create 'dataset/ruido', 'dataset/voces_humanas', and 'dataset/psicofonias_entidades' folders with .wav files.")