import json
import logging
from core.mqtt_client import MQTTPublisher
from core.data_generator import DataGenerator

def main():
    logging.basicConfig(level=logging.INFO)
    
    try:
        with open("config/mqtt_config.json") as f:
            mqtt_config = json.load(f)
        
        mqtt = MQTTPublisher(mqtt_config)
        generator = DataGenerator(mqtt)
        
        generator.start_stream(
            "config/scenario.json",
            frequency_hz=10,
            packets_per_sec=2
        )
        
        input("Генерация запущена. Нажмите Enter для остановки...\n")
        
    except Exception as e:
        logging.error(f"Ошибка: {e}")
    finally:
        generator.stop()
        mqtt.shutdown()

if __name__ == "__main__":
    main()