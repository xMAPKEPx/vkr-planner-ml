import os
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

MODEL_PATH = "ml_model.pkl"
DATA_PATH = "training_data.csv"

class MlPredictor:
    def __init__(self):
        self.model = None
        self.vectorizer = TfidfVectorizer(max_features=50) # Для анализа текста задачи
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model, self.vectorizer = joblib.load(MODEL_PATH)
                print("✅ ML Model loaded successfully.")
            except Exception as e:
                print(f"⚠️ Error loading model: {e}")

    def _get_data_count(self):
        if os.path.exists(DATA_PATH):
            return len(pd.read_csv(DATA_PATH))
        return 0

    def predict_time(self, title: str, description: str, category: str, k_speed: float) -> float:
        """Предсказывает время. Если данных мало — использует эвристику."""
        
        # ЭВРИСТИКА (пока данных мало)
        if self._get_data_count() < 10 or self.model is None:
            print("🐣 Cold start: Using heuristics (data < 10)")
            base_hours = 4.0 # База
            complexity_factor = len(title + (description or "")) * 0.05 # Длина текста
            return max(0.5, (base_hours + complexity_factor) * k_speed)

        # ML (когда данных достаточно)
        try:
            print("🤖 ML Mode: Predicting with Random Forest")
            # Векторизация текста
            text_features = self.vectorizer.transform([f"{title} {description or ''}"])
            
            # Фичи: TF-IDF текста + Категория (закодированная) + Скорость юзера
            # Для простоты в этом примере используем только текст, но можно добавить OneHot категорию
            prediction = self.model.predict(text_features)[0]
            
            # Корректируем на скорость юзера
            return max(0.5, prediction * k_speed)
        except Exception as e:
            print(f"⚠️ ML Prediction failed, fallback to heuristic: {e}")
            return 4.0 * k_speed

    def record_task(self, title: str, description: str, category: str, actual_hours: float):
        """Записывает факт выполнения для будущего обучения"""
        data = {
            'text': f"{title} {description or ''}",
            'category': category,
            'actual_hours': actual_hours
        }
        
        # Сохраняем в CSV
        df_new = pd.DataFrame([data])
        header = not os.path.exists(DATA_PATH)
        df_new.to_csv(DATA_PATH, mode='a', header=header, index=False)
        print(f"📚 Recorded task for training. Total data: {self._get_data_count()}")

    def retrain_model(self):
        """Переобучает модель на новых данных"""
        if self._get_data_count() < 10:
            return False
            
        print("🔄 Retraining Random Forest...")
        df = pd.read_csv(DATA_PATH)
        
        # Подготовка данных
        X_text = df['text']
        y = df['actual_hours']
        
        # Векторизация (обновляем словарь слов)
        X = self.vectorizer.fit_transform(X_text)
        
        # Обучение
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.model.fit(X, y)
        
        # Сохранение
        joblib.dump((self.model, self.vectorizer), MODEL_PATH)
        print("✅ Model retrained and saved.")
        return True

predictor = MlPredictor()