import torch
import torch.nn as nn
from torchvision import models

def build_resnet50(num_classes: int = 2, pretrained: bool = True, fine_tune_layers: int = 1):
    """
    Constructs ResNet50 architecture with transfer learning head.
    Pretrained weights: ResNet50_Weights.DEFAULT (ImageNet).
    """
    weights = models.ResNet50_Weights.DEFAULT if pretrained else None
    model = models.resnet50(weights=weights)
    
    # Freeze base feature extractor
    for param in model.parameters():
        param.requires_grad = False
        
    # Optionally unfreeze layer4 for fine-tuning
    if fine_tune_layers > 0:
        for param in model.layer4.parameters():
            param.requires_grad = True
            
    # Replace final fully connected layer
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.BatchNorm1d(256),
        nn.Dropout(p=0.2),
        nn.Linear(256, num_classes)
    )
    
    return model
