import subprocess
import json

tests = ['plastic_bottle.jpg', 'metal_can.jpg', 'banana_peel.jpg', 'food_waste.jpg']
print('=== LIVE API ENDPOINT VERIFICATION ===')
for t in tests:
    cmd = ['curl.exe', '-s', '-X', 'POST', 'http://127.0.0.1:8000/api/predict', '-F', f'file=@frontend/public/examples/{t}', '-F', 'model_name=mobilenet_v2']
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        d = json.loads(r.stdout)
        pred_class = d.get('predicted_class')
        category = d.get('segregation_category')
        conf = d.get('confidence', 0) * 100
        bin_assigned = d.get('bin_assigned')
        servo = d.get('servo_angle_deg')
        print(f"  {t:<18} -> class={pred_class:<10} | stream={category:<17} | conf={conf:5.1f}% | bin={bin_assigned} (servo {servo} deg)")
    except Exception as e:
        print(f"  {t}: error {r.stdout[:80]}")
