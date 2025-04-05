import time
import json
import logging
from threading import Thread, Event
from typing import Dict, Union
from .scenario import Scenario

class DataGenerator:
    def __init__(self, mqtt_publisher):
        self.mqtt = mqtt_publisher
        self._stop_event = Event()
        self.thread = None
        self.logger = logging.getLogger("Generator")
        self.current_scenario = None

    def start_stream(self, 
                   scenario_config: Union[Dict, str],
                   frequency_hz: int = 10,
                   packets_per_sec: int = 2):
        """Запуск генерации данных"""
        if self.thread and self.thread.is_alive():
            self.stop()

        self.current_scenario = self._load_scenario(scenario_config)
        values_per_packet = frequency_hz // packets_per_sec
        packet_interval = 1.0 / packets_per_sec
        
        self._stop_event.clear()
        self.thread = Thread(
            target=self._generation_loop,
            args=(values_per_packet, packet_interval),
            daemon=True
        )
        self.thread.start()
        self.logger.info(f"Started streaming at {frequency_hz}Hz")

    def _load_scenario(self, config: Union[Dict, str]) -> Scenario:
        """Загрузка сценария из конфига"""
        if isinstance(config, str):
            with open(config) as f:
                config = json.load(f)
        return Scenario.from_json(config)

    def _generation_loop(self, values_per_packet: int, interval: float):
        """Основной цикл генерации данных"""
        next_packet_time = time.time()
        
        while not self._stop_event.is_set():
            packet = []
            for _ in range(values_per_packet):
                if self._stop_event.is_set():
                    break
                
                value = self.current_scenario.get_value()
                packet.append(round(value, 4))
                self.current_scenario.advance_time(1.0 / (values_per_packet * interval))
            
            if packet:
                self.mqtt.publish_packet(packet, next_packet_time)
            
            next_packet_time += interval
            sleep_time = next_packet_time - time.time()
            if sleep_time > 0:
                time.sleep(sleep_time)

    def stop(self):
        """Остановка генерации"""
        self._stop_event.set()
        if self.thread:
            self.thread.join(timeout=1)
        self.logger.info("Data generation stopped")

    def is_running(self) -> bool:
        """Проверка активности генерации"""
        return self.thread and self.thread.is_alive()