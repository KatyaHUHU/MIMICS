import time
import json
import logging
from threading import Thread, Event
from typing import Dict, Union, List

from .mqtt_client import MQTTPublisher
from .scenario import Scenario

logger = logging.getLogger("Generator")

class DataGenerator:
    def __init__(self, mqtt_publisher: MQTTPublisher):
        self.mqtt_publisher = mqtt_publisher
        self._stop_event = Event()
        self.thread = None
        self.current_scenario = None

    def start_stream(
        self,
        scenario_config: Union[Dict, str],
        frequency_hz: int = 10,
        packets_per_sec: int = 2
    ):
        """Запускает поток генерации в фоне."""
        # Если старый поток ещё жив — останавливаем
        if self.thread and self.thread.is_alive():
            self.stop()

        if frequency_hz % packets_per_sec != 0:
            raise ValueError("frequency_hz must be divisible by packets_per_sec")

        # Загружаем сценарий
        self.current_scenario = self._load_scenario(scenario_config)
        values_per_packet = frequency_hz // packets_per_sec
        time_step = 1.0 / frequency_hz
        packet_interval = 1.0 / packets_per_sec

        # Сбрасываем флаг и запускаем поток
        self._stop_event.clear()
        self.thread = Thread(
            target=self._generation_loop,
            args=(values_per_packet, time_step, packet_interval),
            daemon=True
        )
        self.thread.start()
        logger.info(f"Generator: Started streaming at {frequency_hz}Hz ({packets_per_sec} pps)")

    def _load_scenario(self, config: Union[Dict, str]) -> Scenario:
        """Преобразует JSON-конфиг в объект Scenario."""
        if isinstance(config, str):
            with open(config, 'r', encoding='utf-8') as f:
                config = json.load(f)
        return Scenario.from_json(config)

    def _generation_loop(self, values_per_packet: int, time_step: float, packet_interval: float):
        """Цикл, собирающий и публикующий пакеты, пока не вызовут stop()."""
        next_packet_time = time.time()

        while not self._stop_event.is_set():
            packet = []
            packet_start = self.current_scenario.current_time

            for i in range(values_per_packet):
                if self._stop_event.is_set():
                    break
                value = self.current_scenario.get_value()
                packet.append({
                    "value": round(value, 4),
                    "timestamp": packet_start + i * time_step
                })
                self.current_scenario.advance_time(time_step)

            if packet:
                logger.debug(f"Generator: Packet generated: {packet}")
                self.mqtt_publisher.publish_packet(packet, next_packet_time)

            next_packet_time += packet_interval
            sleep_time = next_packet_time - time.time()
            if sleep_time > 0:
                time.sleep(sleep_time)

        logger.info("Generator: Stopped streaming")

    def stop(self):
        """Устанавливает флаг остановки и ждёт завершения потока."""
        self._stop_event.set()
        if self.thread:
            self.thread.join(timeout=2)
        logger.info("Generator: Stop requested")

    def is_running(self) -> bool:
        """Проверяет, жив ли поток генерации."""
        return bool(self.thread and self.thread.is_alive())
