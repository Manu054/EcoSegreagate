import os
from .controller import BaseSortingController
from .simulated import SimulatedSortingController
from .servo_adapter import PhysicalServoAdapter

_controller_instance: BaseSortingController = None

def get_hardware_controller() -> BaseSortingController:
    global _controller_instance
    if _controller_instance is None:
        if os.getenv("ENABLE_PHYSICAL_ACTUATORS", "false").lower() == "true":
            port = os.getenv("HARDWARE_SERIAL_PORT", "COM3")
            _controller_instance = PhysicalServoAdapter(serial_port=port, enable_physical=True)
        else:
            _controller_instance = SimulatedSortingController()
    return _controller_instance
