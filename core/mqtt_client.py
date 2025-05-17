# core/mqtt_client.py
import json
import time
import uuid
import logging
from typing import Dict, Any, List

import paho.mqtt.client as mqtt

logger = logging.getLogger("MQTT")


class MQTTPublisher:
    """
    Лёгкий обёртка‑паблишер для работы с публичным брокером test.mosquitto.org.
    Создаёт уникальный Client‑ID и всегда открывает clean session, чтобы
    брокер не отвечал «Not authorized» (rc = 7) при повторных коннектах.
    """

    def __init__(self, config: Dict[str, Any]):
        # Конфигурация
        self.broker = config["broker"]
        self.port = config["port"]
        self.topic = config["topic"]
        self.qos = config.get("qos", 0)
        self.username = config.get("username", "")
        self.password = config.get("password", "")

        # 👉 Уникальный client_id + clean_session=True
        client_id = f"mimics_{uuid.uuid4().hex[:8]}"
        self.client = mqtt.Client(client_id=client_id, clean_session=True)

        if self.username or self.password:
            self.client.username_pw_set(self.username, self.password)

        # Колбэки
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish

        # Подключаемся к брокеру и запускаем loop
        self.client.connect(self.broker, self.port, keepalive=60)
        self.client.loop_start()

        logger.debug(
            f"MQTT: Initialised client_id={client_id}, broker={self.broker}:{self.port}"
        )

    # --------------------------------------------------------------------- #
    #                         Колбэки MQTT‑клиента                           #
    # --------------------------------------------------------------------- #

    @staticmethod
    def _reason_str(rc: int) -> str:
        return {
            0: "Connection accepted",
            1: "Incorrect protocol version",
            2: "Invalid client identifier",
            3: "Server unavailable",
            4: "Bad username or password",
            5: "Not authorised",
            7: "Not authorised (flood / duplicate ID)",
        }.get(rc, f"Unknown ({rc})")

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info(
                f"MQTT: Connected to {self.broker}:{self.port} "
                f"clean_session={client._clean_session}"
            )
        else:
            logger.error(f"MQTT: Connect failed: {self._reason_str(rc)}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"MQTT: Disconnected: {self._reason_str(rc)}")

    def _on_publish(self, client, userdata, mid):
        logger.debug(f"MQTT: Message {mid} published to {self.topic}")

    # --------------------------------------------------------------------- #
    #                           Публикация пакета                            #
    # --------------------------------------------------------------------- #

    def publish_packet(self, packet: List[Dict[str, Any]], target_time: float | None = None):
        """
        Формирует «обёртку» пакета и публикует JSON.
        """
        payload = {
            "sensor_id": "mimics_v1",
            "packet": packet,
            "packet_size": len(packet),
            "packet_timestamp": target_time or time.time(),
        }
        data = json.dumps(payload, ensure_ascii=False)
        logger.info(f"MQTT: Publishing packet → {self.topic}: {data}")
        self.client.publish(self.topic, payload=data, qos=self.qos)

    # --------------------------------------------------------------------- #

    def shutdown(self):
        """
        Корректно останавливает loop и разрывает соединение.
        """
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("MQTT: Client shutdown")
