import torch
import torch.nn as nn
from torchvision import models

def build_mobilenet_v2(num_classes: int = 2, pretrained: bool = True, fine_tune_layers: int = 4):
    """
    Constructs MobileNetV2 architecture with transfer learning head.
    Pretrained weights: MobileNet_V2_Weights.DEFAULT (ImageNet).
    """
    weights = models.MobileNet_V2_Weights.DEFAULT if pretrained else None
    model = models.mobilenet_v2(weights=weights)
    
    # Freeze base feature extractor layers
    for param in model.features.parameters():
        param.requires_grad = False
        
    # Optionally unfreeze top fine_tune_layers
    if fine_tune_layers > 0:
        for layer in list(model.features.children())[-fine_tune_layers:]:
            for param in layer.parameters():
                param.requires_grad = True
                
    # Replace final classification head
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 128),
        nn.ReLU(),
        nn.BatchNorm1d(128),
        nn.Dropout(p=0.2),
        nn.Linear(128, num_classes)
    )
    
    return model
