import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

public_examples = Path("c:/ML_Project/frontend/public/examples")
public_assets = Path("c:/ML_Project/frontend/public/assets")
public_examples.mkdir(parents=True, exist_ok=True)
public_assets.mkdir(parents=True, exist_ok=True)

def create_plastic_bottle(path, size=(400, 300)):
    # Create realistic studio shot of plastic bottle on clean warm neutral background
    img = Image.new("RGB", size, "#f0eee9")
    draw = ImageDraw.Draw(img)
    
    # Soft shadow
    for i in range(12):
        alpha = int(40 - i * 3)
        draw.ellipse([110 - i*2, 230 - i, 290 + i*2, 255 + i*2], fill=f"#{220-i*5:02x}{218-i*5:02x}{214-i*5:02x}")
    
    # Bottle Body (translucent PET with blue tint)
    # Main cylindrical body
    body_box = [150, 95, 250, 235]
    draw.rounded_rectangle(body_box, radius=18, fill="#d6eaf8", outline="#85c1e9", width=2)
    
    # Horizontal rib contours
    for y in [130, 155, 180, 205]:
        draw.line([154, y, 246, y], fill="#aed6f1", width=3)
        draw.line([154, y+1, 246, y+1], fill="#ebf5fb", width=1)
        
    # Bottle Neck & Cap
    draw.polygon([(175, 95), (182, 60), (218, 60), (225, 95)], fill="#d6eaf8", outline="#85c1e9")
    # Cap (Blue)
    draw.rounded_rectangle([180, 42, 220, 60], radius=3, fill="#1f77b4", outline="#154360", width=2)
    # Ribs on cap
    for x in range(184, 218, 4):
        draw.line([x, 43, x, 59], fill="#2980b9", width=1)
        
    # Reflections / Highlight streak
    draw.line([165, 105, 165, 225], fill="#ffffff", width=4)
    draw.line([169, 110, 169, 220], fill="#ffffff", width=2)
    
    img.save(path, quality=95)
    print(f"Created {path}")

def create_banana_peel(path, size=(400, 300)):
    img = Image.new("RGB", size, "#f2eee7")
    draw = ImageDraw.Draw(img)
    
    # Soft shadow
    draw.ellipse([90, 225, 310, 250], fill="#ddd6cc")
    
    # Banana peel curves (yellow with brown tips and green stalk)
    # Peel petal 1
    draw.polygon([(190, 130), (100, 195), (140, 230), (200, 155)], fill="#f1c40f", outline="#d4ac0d")
    # Peel petal 2 (central)
    draw.polygon([(200, 130), (205, 235), (235, 235), (215, 130)], fill="#f4d03f", outline="#d4ac0d")
    # Peel petal 3 (right)
    draw.polygon([(215, 135), (300, 185), (280, 220), (205, 155)], fill="#f7dc6f", outline="#d4ac0d")
    
    # Stalk / Stem at top
    draw.rounded_rectangle([195, 105, 215, 132], radius=4, fill="#5d6d7e", outline="#34495e")
    draw.ellipse([197, 100, 213, 108], fill="#27ae60")
    
    # Brown spots (sugar spots)
    spots = [(130, 205), (170, 180), (220, 190), (260, 195), (210, 215), (150, 210)]
    for sx, sy in spots:
        draw.ellipse([sx-3, sy-2, sx+3, sy+2], fill="#7e5109")
        
    img.save(path, quality=95)
    print(f"Created {path}")

def create_paper_cup(path, size=(400, 300)):
    img = Image.new("RGB", size, "#f0eee9")
    draw = ImageDraw.Draw(img)
    
    # Shadow
    draw.ellipse([130, 235, 270, 255], fill="#ded8ce")
    
    # Paper cup body (kraft paper warm tan)
    draw.polygon([(150, 90), (165, 235), (235, 235), (250, 90)], fill="#d7bde2", outline="#c39bd3")
    draw.polygon([(150, 90), (165, 235), (235, 235), (250, 90)], fill="#d5b895", outline="#b7956b")
    
    # Cardboard heat sleeve
    draw.polygon([(155, 140), (160, 190), (240, 190), (245, 140)], fill="#8d6e63", outline="#6d4c41")
    
    # White rolled rim at top
    draw.ellipse([146, 82, 254, 98], fill="#fdfefe", outline="#bdc3c7", width=2)
    # Inside shadow
    draw.ellipse([152, 85, 248, 95], fill="#e5e7e9")
    
    img.save(path, quality=95)
    print(f"Created {path}")

def create_cardboard(path, size=(400, 300)):
    img = Image.new("RGB", size, "#f0eee9")
    draw = ImageDraw.Draw(img)
    
    # Shadow
    draw.ellipse([90, 230, 310, 255], fill="#ddd6cc")
    
    # 3D cardboard box
    # Front face
    draw.polygon([(130, 140), (200, 175), (200, 240), (130, 205)], fill="#bcaaa4", outline="#8d6e63", width=2)
    # Right face
    draw.polygon([(200, 175), (280, 135), (280, 200), (200, 240)], fill="#a1887f", outline="#6d4c41", width=2)
    # Top flap (open or folded)
    draw.polygon([(130, 140), (210, 100), (280, 135), (200, 175)], fill="#d7ccc8", outline="#8d6e63", width=2)
    
    # Flap tape line
    draw.line([165, 120, 240, 155], fill="#ffe082", width=4)
    # Recycle logo symbol in green
    draw.ellipse([160, 185, 180, 205], outline="#2e7d32", width=2)
    
    img.save(path, quality=95)
    print(f"Created {path}")

def create_food_waste(path, size=(400, 300)):
    img = Image.new("RGB", size, "#f0eee9")
    draw = ImageDraw.Draw(img)
    
    # Shadow
    draw.ellipse([100, 225, 300, 255], fill="#ddd6cc")
    
    # Compost bowl / pile
    # Salad greens & vegetable trimmings
    draw.ellipse([120, 160, 280, 235], fill="#388e3c")
    draw.ellipse([130, 150, 230, 210], fill="#4caf50")
    draw.ellipse([170, 140, 270, 200], fill="#81c784")
    
    # Tomato/carrot slices (orange/red)
    draw.ellipse([150, 175, 180, 195], fill="#e53935")
    draw.ellipse([210, 165, 235, 185], fill="#fb8c00")
    draw.ellipse([185, 190, 215, 210], fill="#e53935")
    
    # Bread crust / grain scraps (golden brown)
    draw.rounded_rectangle([135, 190, 175, 215], radius=6, fill="#bcaaa4", outline="#8d6e63")
    
    img.save(path, quality=95)
    print(f"Created {path}")

def create_metal_can(path, size=(400, 300)):
    img = Image.new("RGB", size, "#f0eee9")
    draw = ImageDraw.Draw(img)
    
    # Shadow
    draw.ellipse([140, 235, 260, 255], fill="#d0cac0")
    
    # Aluminum cylindrical body
    draw.rounded_rectangle([155, 90, 245, 235], radius=10, fill="#b0bec5", outline="#78909c", width=2)
    
    # Metallic reflection bands
    draw.rectangle([165, 92, 178, 233], fill="#eceff1")
    draw.rectangle([188, 92, 202, 233], fill="#cfd8dc")
    draw.rectangle([215, 92, 225, 233], fill="#ffffff")
    
    # Top lid
    draw.ellipse([155, 80, 245, 100], fill="#eceff1", outline="#78909c", width=2)
    # Pull tab
    draw.ellipse([190, 85, 215, 95], fill="#90a4ae", outline="#546e7a")
    draw.ellipse([198, 88, 207, 92], fill="#cfd8dc")
    
    img.save(path, quality=95)
    print(f"Created {path}")

def create_conveyor_camera(path, size=(640, 400)):
    # Create the industrial conveyor belt view shown in Live Telemetry
    img = Image.new("RGB", size, "#262b2f")
    draw = ImageDraw.Draw(img)
    
    # Metallic background and conveyor bed
    # Wall/Frame
    draw.rectangle([0, 0, 640, 120], fill="#374151")
    draw.line([0, 120, 640, 120], fill="#4b5563", width=3)
    
    # Perspective conveyor rails
    # Left rail
    draw.polygon([(0, 300), (0, 160), (220, 120), (240, 120), (50, 400), (0, 400)], fill="#64748b")
    # Right rail
    draw.polygon([(640, 300), (640, 160), (420, 120), (400, 120), (590, 400), (640, 400)], fill="#64748b")
    
    # Conveyor belt (rubber textured dark slate)
    draw.polygon([(230, 120), (410, 120), (580, 400), (60, 400)], fill="#1e242b")
    
    # Belt ribs / slats
    for y in range(130, 400, 22):
        progress = (y - 120) / 280
        x1 = int(230 - progress * 170)
        x2 = int(410 + progress * 170)
        draw.line([x1, y, x2, y], fill="#2d3748", width=2)
        
    # Stainless steel guide rods
    draw.line([0, 240, 640, 240], fill="#94a3b8", width=4)
    draw.line([0, 242, 640, 242], fill="#f1f5f9", width=1)
    
    # Plastic bottle lying on conveyor belt
    # Shadow under bottle
    draw.ellipse([250, 265, 390, 295], fill="#111827")
    
    # Tilted translucent bottle
    draw.polygon([(270, 255), (370, 220), (385, 245), (285, 280)], fill="#93c5fd")
    draw.polygon([(265, 258), (285, 250), (288, 256), (268, 264)], fill="#2563eb") # blue cap
    draw.line([(280, 260), (370, 230)], fill="#ffffff", width=3)
    draw.line([(285, 268), (365, 240)], fill="#bfdbfe", width=2)
    
    img.save(path, quality=95)
    print(f"Created {path}")

create_plastic_bottle(public_examples / "plastic_bottle.jpg")
create_banana_peel(public_examples / "banana_peel.jpg")
create_paper_cup(public_examples / "paper_cup.jpg")
create_cardboard(public_examples / "cardboard.jpg")
create_food_waste(public_examples / "food_waste.jpg")
create_metal_can(public_examples / "metal_can.jpg")
create_conveyor_camera(public_assets / "conveyor_camera.jpg")
create_plastic_bottle(public_assets / "live_preview_bottle.jpg")

print("All sample UI images successfully generated.")
