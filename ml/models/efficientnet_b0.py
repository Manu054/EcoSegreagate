import torch
import torch.nn as nn
from torchvision import models

def build_efficientnet_b0(num_classes: int = 2, pretrained: bool = True, fine_tune_layers: int = 2):
    """
    Constructs EfficientNetB0 architecture with transfer learning head.
    Pretrained weights: EfficientNet_B0_Weights.DEFAULT (ImageNet).
    """
    weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
    model = models.efficientnet_b0(weights=weights)
    
    # Freeze base feature extractor
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
        nn.SiLU(),
        nn.BatchNorm1d(128),
        nn.Dropout(p=0.2),
        nn.Linear(128, num_classes)
    )
    
    return model
