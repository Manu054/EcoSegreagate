import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from .controller import BaseSortingController, ControllerStatus, SortingActionResult
from ..config import settings

logger = logging.getLogger("hardware.simulated")

class SimulatedSortingController(BaseSortingController):
    """
    Simulated Sorting Controller for software-only execution and demonstration.
    Accurately mirrors physical servo-arm diverters, conveyor pneumatics, and safety interlocks.
    """

    def __init__(self, mapping_file_path: Optional[Path] = None):
        self.simulation_mode = True
        self.is_emergency_stopped = False
        self.current_servo_angle_deg = 0
        self.current_bin = "Neutral / Idle Position"
        self.confidence_threshold = settings.CONFIDENCE_THRESHOLD
        self.total_sort_actions = 0
        self.last_action_timestamp: Optional[str] = None
        self.action_history = []
        
        # Load class mappings
        self.mapping_file_path = mapping_file_path or settings.CLASS_MAPPING_FILE
        self.mappings = self._load_mappings()

    def _load_mappings(self) -> Dict[str, Any]:
        try:
            if self.mapping_file_path.exists():
                with open(self.mapping_file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load class mapping from {self.mapping_file_path}: {e}")
        return {}

    def route_waste(self, segregation_category: str, detailed_class: str, confidence: float) -> SortingActionResult:
        now_str = datetime.utcnow().isoformat()

        if self.is_emergency_stopped:
            return SortingActionResult(
                success=False,
                triggered=False,
                bin_assigned="HALTED: Emergency Stop Active",
                servo_angle_deg=0,
                confidence=confidence,
                threshold_met=False,
                message="Actuator motion inhibited: System is in Emergency Stop state.",
                timestamp=now_str
            )

        # Lookup class definition
        class_info = self.mappings.get("class_mappings", {}).get(detailed_class.lower(), {})
        fallback_info = self.mappings.get("default_fallback", {})

        # Safety Confidence Threshold Check
        if confidence < self.confidence_threshold:
            bin_name = fallback_info.get("bin_name", "Inspection / Manual Review Bin")
            angle = fallback_info.get("servo_angle_deg", 0)
            self.current_bin = bin_name
            self.current_servo_angle_deg = angle
            self.last_action_timestamp = now_str
            self.total_sort_actions += 1

            return SortingActionResult(
                success=True,
                triggered=False,  # Physical sorting diverter not triggered due to uncertainty
                bin_assigned=bin_name,
                servo_angle_deg=angle,
                confidence=confidence,
                threshold_met=False,
                message=f"Confidence ({confidence:.2%}) below safety threshold ({self.confidence_threshold:.2%}). Routed to manual inspection chute.",
                timestamp=now_str
            )

        # High confidence - Route to assigned bin
        if class_info:
            bin_name = class_info.get("bin_name", f"{segregation_category} Bin")
            angle = class_info.get("servo_angle_deg", 90)
        else:
            # Fallback by primary segregation category
            if segregation_category.lower() == "biodegradable":
                bin_name = "Green Bin (Compost)"
                angle = 45
            else:
                bin_name = "Yellow Bin (Recyclable Stream)"
                angle = 135

        self.current_bin = bin_name
        self.current_servo_angle_deg = angle
        self.last_action_timestamp = now_str
        self.total_sort_actions += 1

        return SortingActionResult(
            success=True,
            triggered=True,
            bin_assigned=bin_name,
            servo_angle_deg=angle,
            confidence=confidence,
            threshold_met=True,
            message=f"Actuated servo to {angle}° targeting {bin_name}.",
            timestamp=now_str
        )

    def manual_override(self, target_bin: str, servo_angle_deg: int) -> SortingActionResult:
        now_str = datetime.utcnow().isoformat()
        if self.is_emergency_stopped:
            return SortingActionResult(
                success=False,
                triggered=False,
                bin_assigned="HALTED: Emergency Stop Active",
                servo_angle_deg=0,
                confidence=1.0,
                threshold_met=True,
                message="Manual override rejected: Emergency Stop is active.",
                timestamp=now_str
            )

        self.current_bin = target_bin
        self.current_servo_angle_deg = servo_angle_deg
        self.last_action_timestamp = now_str
        self.total_sort_actions += 1

        return SortingActionResult(
            success=True,
            triggered=True,
            bin_assigned=target_bin,
            servo_angle_deg=servo_angle_deg,
            confidence=1.0,
            threshold_met=True,
            message=f"Manual override applied: Servo positioned at {servo_angle_deg}° for '{target_bin}'.",
            timestamp=now_str
        )

    def trigger_emergency_stop(self) -> ControllerStatus:
        self.is_emergency_stopped = True
        self.current_servo_angle_deg = 0
        self.current_bin = "SAFE NEUTRAL (E-STOP ACTIVATED)"
        self.last_action_timestamp = datetime.utcnow().isoformat()
        logger.warning("HARDWARE EMERGENCY STOP ENGAGED.")
        return self.get_status()

    def reset_emergency_stop(self) -> ControllerStatus:
        self.is_emergency_stopped = False
        self.current_servo_angle_deg = 0
        self.current_bin = "Neutral / Idle Position"
        self.last_action_timestamp = datetime.utcnow().isoformat()
        logger.info("HARDWARE EMERGENCY STOP RESET.")
        return self.get_status()

    def get_status(self) -> ControllerStatus:
        status_msg = "Operational (Simulation Mode Active)"
        if self.is_emergency_stopped:
            status_msg = "CRITICAL: Emergency Stop Active"

        return ControllerStatus(
            simulation_mode=self.simulation_mode,
            is_emergency_stopped=self.is_emergency_stopped,
            current_servo_angle_deg=self.current_servo_angle_deg,
            current_bin=self.current_bin,
            confidence_threshold=self.confidence_threshold,
            total_sort_actions=self.total_sort_actions,
            last_action_timestamp=self.last_action_timestamp,
            status_message=status_msg
        )
