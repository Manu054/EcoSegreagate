# Setup and Execution Guide
## Smart Waste Management System Using Machine Learning

### 1. Prerequisites
* Python 3.11+
* Node.js v20+ / npm 10+
* Git

---

### 2. Environment Setup
```bash
# Clone or navigate to the workspace
cd c:\ML_Project

# Install backend dependencies
python -m pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

### 3. Kaggle Dataset Setup
To train on the official Kaggle Waste Classification Data:
1. Download from Kaggle: https://www.kaggle.com/datasets/techsash/waste-classification-data
2. Unpack zip into `c:\ML_Project\dataset\`
3. Structure:
   ```
   dataset/
   ├── TRAIN/
   │   ├── O/  (Organic)
   │   └── R/  (Recyclable)
   └── TEST/
       ├── O/
       └── R/
   ```

*Note:* If Kaggle is not yet downloaded, the system includes an automated demonstration synthesis module (`python ml/dataset/dataset_manager.py --demo`) allowing immediate verification of all training pipelines.

---

### 4. Training the Three Models
```bash
# Train MobileNetV2, ResNet50, and EfficientNetB0
python ml/train.py --model all --epochs 5 --batch_size 16

# Evaluate all three models on untouched test split
python ml/evaluate.py
```

---

### 5. Running the Application
```bash
# Terminal 1: Launch FastAPI Backend Server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Launch React Frontend Dev Server
cd frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

---

### 6. Running Automated Tests
```bash
python -m pytest backend/tests/test_api.py -v
```
