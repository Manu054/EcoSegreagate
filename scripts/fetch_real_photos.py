import io
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps

public_examples = Path("c:/ML_Project/frontend/public/examples")
public_assets = Path("c:/ML_Project/frontend/public/assets")
public_examples.mkdir(parents=True, exist_ok=True)
public_assets.mkdir(parents=True, exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

real_photos = {
    "banana_peel": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80",
    "plastic_bottle": "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80",
    "paper_cup": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    "cardboard": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
    "food_waste": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    "metal_can": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
    "conveyor": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
}

for name, url in real_photos.items():
    try:
        print(f"Downloading real photo for {name}...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        
        img = Image.open(io.BytesIO(data)).convert("RGB")
        
        if name == "conveyor":
            # Resize conveyor to 640x400
            fitted = ImageOps.fit(img, (640, 400), Image.Resampling.LANCZOS)
            dest = public_assets / "conveyor_camera.jpg"
            fitted.save(dest, quality=92)
            print(f"Saved real conveyor photo -> {dest}")
        else:
            # Resize example specimen to 400x300
            fitted = ImageOps.fit(img, (400, 300), Image.Resampling.LANCZOS)
            dest = public_examples / f"{name}.jpg"
            fitted.save(dest, quality=92)
            print(f"Saved real photo -> {dest}")
            
            # Also save plastic_bottle to live_preview_bottle
            if name == "plastic_bottle":
                live_dest = public_assets / "live_preview_bottle.jpg"
                fitted.save(live_dest, quality=92)
                print(f"Saved real bottle preview -> {live_dest}")

    except Exception as e:
        print(f"Error processing {name}: {e}")

print("Real photo setup completed successfully.")
