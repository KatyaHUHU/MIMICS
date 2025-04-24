import paho.mqtt.client as mqtt
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MQTT_SUB")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("Connected to broker")
        client.subscribe("sensors/mimics_v1")
    else:
        logger.error(f"Connection failed: {rc}")

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        logger.info(f"Received: {data}")
    except Exception as e:
        logger.error(f"Decoding error: {e}")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

# Используем те же параметры, что и в вашем MQTTPublisher
client.connect("test.mosquitto.org", 1883)
client.loop_forever()