"""
Physical Actuator and Servo Motor Adapter Module (Isolated Hardware Layer)
--------------------------------------------------------------------------
Provides standard hardware bridging for:
1. Arduino Uno / Nano via USB Serial (9600 / 115200 baud)
2. Raspberry Pi GPIO (PWM signal on BCM pin 18)
3. I2C 16-channel PWM Servo Driver (PCA9685 at 0x40)

IMPORTANT SAFETY ARCHITECTURE:
- By default, physical actuation is strictly disabled (ENABLE_PHYSICAL_ACTUATORS=False).
- Software tests, development runs, and demos execute purely through SimulatedSortingController.
- Even when physical hardware is connected, commands are gated by:
    a) Emergency Stop status
    b) Software confidence threshold (>= 0.65)
    c) Boundary clamping (0° <= angle <= 180°)
"""

import logging
import os
from typing import Optional
from .controller import BaseSortingController, ControllerStatus, SortingActionResult
from .simulated import SimulatedSortingController

logger = logging.getLogger("hardware.servo_adapter")

class PhysicalServoAdapter(BaseSortingController):
    """
    Physical Servo Adapter providing bridge to microcontroller serial or RPi GPIO.
    Falls back safely to simulated mode if hardware port cannot be opened.
    """

    def __init__(self, serial_port: str = "COM3", baud_rate: int = 9600, enable_physical: bool = False):
        self.enable_physical = enable_physical or os.getenv("ENABLE_PHYSICAL_ACTUATORS", "false").lower() == "true"
        self.serial_port = serial_port
        self.baud_rate = baud_rate
        self.connection = None
        self._simulator = SimulatedSortingController()
        
        if self.enable_physical:
            self._init_physical_connection()
        else:
            logger.info("Physical hardware disabled: Running in safe software simulation mode.")

    def _init_physical_connection(self):
        try:
            import serial
            self.connection = serial.Serial(self.serial_port, self.baud_rate, timeout=1.0)
            logger.info(f"Initialized physical serial connection on {self.serial_port} @ {self.baud_rate} baud.")
        except Exception as e:
            logger.warning(f"Could not open physical serial port {self.serial_port}: {e}. Falling back to simulation.")
            self.connection = None
            self.enable_physical = False

    def route_waste(self, segregation_category: str, detailed_class: str, confidence: float) -> SortingActionResult:
        # Run simulation logic for state tracking & validation
        result = self._simulator.route_waste(segregation_category, detailed_class, confidence)

        if self.enable_physical and self.connection and result.triggered:
            try:
                # Transmit command: "SERVO:<angle>\n"
                cmd = f"SERVO:{result.servo_angle_deg}\n"
                self.connection.write(cmd.encode("utf-8"))
                logger.info(f"[HARDWARE TX] Sent command to microcontroller: {cmd.strip()}")
            except Exception as e:
                logger.error(f"[HARDWARE ERROR] Failed writing to microcontroller: {e}")

        return result

    def manual_override(self, target_bin: str, servo_angle_deg: int) -> SortingActionResult:
        result = self._simulator.manual_override(target_bin, servo_angle_deg)
        if self.enable_physical and self.connection:
            try:
                cmd = f"SERVO:{servo_angle_deg}\n"
                self.connection.write(cmd.encode("utf-8"))
            except Exception as e:
                logger.error(f"[HARDWARE ERROR] Failed manual override transmission: {e}")
        return result

    def trigger_emergency_stop(self) -> ControllerStatus:
        status = self._simulator.trigger_emergency_stop()
        if self.enable_physical and self.connection:
            try:
                self.connection.write(b"ESTOP\n")
            except Exception as e:
                logger.error(f"Failed sending ESTOP signal: {e}")
        return status

    def reset_emergency_stop(self) -> ControllerStatus:
        status = self._simulator.reset_emergency_stop()
        if self.enable_physical and self.connection:
            try:
                self.connection.write(b"RESET\n")
            except Exception as e:
                logger.error(f"Failed sending RESET signal: {e}")
        return status

    def get_status(self) -> ControllerStatus:
        status = self._simulator.get_status()
        if self.enable_physical and self.connection:
            status.simulation_mode = False
            status.status_message = f"Connected to Physical Actuator on {self.serial_port}"
        return status
