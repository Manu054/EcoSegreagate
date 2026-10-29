from fastapi import APIRouter
from ..hardware import get_hardware_controller
from ..schemas import HardwareStatus, HardwareManualOverrideRequest

router = APIRouter(prefix="/hardware", tags=["Hardware Integration"])

@router.get("/status", response_model=HardwareStatus)
def get_hardware_status():
    """Returns telemetry of the simulated or physical diverter arm and safety interlocks."""
    hw = get_hardware_controller()
    status = hw.get_status()
    return HardwareStatus(
        simulation_mode=status.simulation_mode,
        current_bin=status.current_bin,
        servo_angle_deg=status.current_servo_angle_deg,
        is_emergency_stopped=status.is_emergency_stopped,
        confidence_threshold=status.confidence_threshold,
        last_action_timestamp=status.last_action_timestamp,
        total_sort_actions=status.total_sort_actions,
        safety_message=status.status_message
    )

@router.post("/override")
def manual_override(request: HardwareManualOverrideRequest):
    """Manually commands sorting diverter arm to position over a target bin."""
    hw = get_hardware_controller()
    result = hw.manual_override(request.target_bin, request.servo_angle_deg)
    return result

@router.post("/emergency-stop")
def trigger_emergency_stop():
    """Immediately trips safety relay and returns sorting mechanism to safe home neutral."""
    hw = get_hardware_controller()
    status = hw.trigger_emergency_stop()
    return status

@router.post("/reset")
def reset_emergency_stop():
    """Clears emergency stop latch and returns sorter to operational standby."""
    hw = get_hardware_controller()
    status = hw.reset_emergency_stop()
    return status
