import paho.mqtt.client as mqtt
import json
import time
import logging
from typing import Dict, Any, List

class MQTTPublisher:
    def __init__(self, config: Dict[str, Any]):
        self.client = mqtt.Client()
        self.client.username_pw_set(config["username"], config["password"])
        self.client.connect(config["broker"], config["port"])
        self.topic = config["topic"]
        self.qos = config.get("qos", 0)
        self.logger = logging.getLogger("MQTT")
        self.client.loop_start()
        
        self.client.on_publish = self._on_publish
        self.client.on_connect = self._on_connect

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.logger.info("Connected to MQTT Broker")
        else:
            self.logger.error(f"Connection failed with code {rc}")

    def _on_publish(self, client, userdata, mid):
        self.logger.debug(f"Message {mid} published")

    def publish_packet(self, packet: List[Dict], target_time: float = None):
        """Отправка пакета данных"""
        payload = {
            "sensor_id": "mimics_v1",
            "packet": packet,
            "packet_size": len(packet),
            "packet_timestamp": target_time or time.time()
        }
        self.client.publish(
            topic=self.topic,
            payload=json.dumps(payload),
            qos=self.qos
        )

    def shutdown(self):
        self.client.loop_stop()
        self.client.disconnect()
        self.logger.info("MQTT client shutdown")