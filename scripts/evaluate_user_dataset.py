import sys
sys.path.insert(0, 'c:/ML_Project')

import torch
import torchvision.transforms as transforms
from PIL import Image
from pathlib import Path
from ml.models.model_builder import ModelBuilder

device = torch.device('cpu')
model_info = ModelBuilder.load_model('mobilenet_v2', Path('c:/ML_Project/saved_models/mobilenet_v2'), device=device)
model = model_info['model']
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

classes = ['cardboard', 'glass', 'metal', 'organic', 'paper', 'plastic']
bio_classes = {'cardboard', 'organic', 'paper'}

archive_dir = Path('c:/ML_Project/dataset_raw/kaggle_archive')
print('=== Evaluating Organic Samples (O) ===')
for f in list((archive_dir / 'O').glob('*.jpg'))[:8]:
    img = Image.open(f).convert('RGB')
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        out = model(tensor)
        probs = torch.softmax(out, dim=1)[0]
        pred_idx = torch.argmax(probs).item()
        pred_class = classes[pred_idx]
        conf = probs[pred_idx].item()
        is_bio = pred_class in bio_classes
        cat = 'Biodegradable' if is_bio else 'Non-Biodegradable'
    print(f'  {f.name}: pred={pred_class:<10} ({conf*100:5.1f}%) -> {cat}')

print('\n=== Evaluating Recyclable Samples (R) ===')
for f in list((archive_dir / 'R').glob('*.jpg'))[:8]:
    img = Image.open(f).convert('RGB')
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        out = model(tensor)
        probs = torch.softmax(out, dim=1)[0]
        pred_idx = torch.argmax(probs).item()
        pred_class = classes[pred_idx]
        conf = probs[pred_idx].item()
        is_bio = pred_class in bio_classes
        cat = 'Biodegradable' if is_bio else 'Non-Biodegradable'
    print(f'  {f.name}: pred={pred_class:<10} ({conf*100:5.1f}%) -> {cat}')
