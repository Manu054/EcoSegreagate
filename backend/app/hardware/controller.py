from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

class ControllerStatus(BaseModel):
    simulation_mode: bool
    is_emergency_stopped: bool
    current_servo_angle_deg: int
    current_bin: str
    confidence_threshold: float
    total_sort_actions: int
    last_action_timestamp: Optional[str] = None
    status_message: str

class SortingActionResult(BaseModel):
    success: bool
    triggered: bool
    bin_assigned: str
    servo_angle_deg: int
    confidence: float
    threshold_met: bool
    message: str
    timestamp: str

class BaseSortingController(ABC):
    """
    Abstract Hardware Sorting Controller Interface.
    Enforces standardized contracts across simulated and physical actuators.
    """

    @abstractmethod
    def route_waste(self, segregation_category: str, detailed_class: str, confidence: float) -> SortingActionResult:
        """
        Calculates destination bin and actuates physical sorting gate or diverter
        only if confidence exceeds safety threshold and emergency stop is disengaged.
        """
        pass

    @abstractmethod
    def manual_override(self, target_bin: str, servo_angle_deg: int) -> SortingActionResult:
        """Manually positions the diverter arm to a specified bin."""
        pass

    @abstractmethod
    def trigger_emergency_stop(self) -> ControllerStatus:
        """Immediately de-energizes actuators and returns gate to safe neutral state."""
        pass

    @abstractmethod
    def reset_emergency_stop(self) -> ControllerStatus:
        """Resets the safety latch following inspection."""
        pass

    @abstractmethod
    def get_status(self) -> ControllerStatus:
        """Retrieves real-time actuator telemetry and safety status."""
        pass
