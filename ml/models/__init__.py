from .mobilenet_v2 import build_mobilenet_v2
from .resnet50 import build_resnet50
from .efficientnet_b0 import build_efficientnet_b0

MODEL_BUILDERS = {
    "mobilenet_v2": build_mobilenet_v2,
    "resnet50": build_resnet50,
    "efficientnet_b0": build_efficientnet_b0,
}

MODEL_DISPLAY_NAMES = {
    "mobilenet_v2": "MobileNetV2",
    "resnet50": "ResNet50",
    "efficientnet_b0": "EfficientNetB0",
}
