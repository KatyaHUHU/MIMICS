#!/usr/bin/env python3
"""
MIMICS Launcher - Универсальный лаунчер для Windows
Автоматическая установка, запуск, остановка и очистка системы имитации датчиков
"""

import os
import sys
import subprocess
import time
import webbrowser
import signal
import argparse
from pathlib import Path

class Colors:
    """ANSI цвета для Windows консоли"""
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

class MimicsLauncher:
    def __init__(self):
        self.root_dir = Path(__file__).parent.absolute()
        self.backend_process = None
        self.frontend_process = None
        
        # Включаем ANSI цвета для Windows
        os.system('color')
        
    def print_banner(self):
        """Красивый баннер приложения"""
        banner = f"""
{Colors.PURPLE}╔══════════════════════════════════════════════════════════╗
║                    🎯 MIMICS LAUNCHER                    ║
║              Система имитации работы датчиков            ║
╚══════════════════════════════════════════════════════════╝{Colors.END}
"""
        print(banner)
        
    def check_dependencies(self):
        """Проверка системных зависимостей"""
        print(f"{Colors.BLUE}🔍 Проверка зависимостей...{Colors.END}")
        
        deps = {
            'docker': {
                'cmd': ['docker', '--version'],
                'error': 'Docker Desktop не установлен.\n   Скачайте: https://www.docker.com/products/docker-desktop'
            },
            'python': {
                'cmd': [sys.executable, '--version'],
                'error': 'Python не найден (но запущен из Python - странно...)'
            },
            'node': {
                'cmd': ['node', '--version'],
                'error': 'Node.js не установлен.\n   Скачайте: https://nodejs.org/en/download/'
            }
        }
        
        all_ok = True
        for name, info in deps.items():
            try:
                result = subprocess.run(
                    info['cmd'], 
                    stdout=subprocess.PIPE, 
                    stderr=subprocess.PIPE, 
                    check=True,
                    text=True
                )
                version = result.stdout.strip().split('\n')[0]
                print(f"{Colors.GREEN}✅ {name}: {version}{Colors.END}")
            except (subprocess.CalledProcessError, FileNotFoundError):
                print(f"{Colors.RED}❌ {info['error']}{Colors.END}")
                all_ok = False
                
        return all_ok
    
    def kill_processes_on_ports(self):
        """Убить процессы на портах БЕЗ убийства самого launcher"""
        print(f"{Colors.CYAN}🔄 Очистка портов и процессов...{Colors.END}")
        
        # Получаем PID текущего процесса (launcher)
        current_pid = str(os.getpid())
        
        # Убить только uvicorn процессы (не весь python.exe)
        try:
            result = subprocess.run(['wmic', 'process', 'get', 'processid,commandline'], 
                                capture_output=True, text=True)
            for line in result.stdout.split('\n'):
                if 'uvicorn' in line and 'main:app' in line:
                    parts = line.strip().split()
                    if parts:
                        pid = parts[-1]
                        if pid != current_pid:  # Не убиваем сам launcher
                            subprocess.run(['taskkill', '/F', '/PID', pid], 
                                        stderr=subprocess.DEVNULL, check=False)
        except:
            pass
        
        # Убить Node.js процессы
        try:
            subprocess.run(['taskkill', '/f', '/im', 'node.exe'], 
                        stderr=subprocess.DEVNULL, check=False)
        except:
            pass
        
        # Очистка портов напрямую
        ports = [3000, 8000]
        for port in ports:
            try:
                result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
                for line in result.stdout.split('\n'):
                    if f':{port}' in line and 'LISTENING' in line:
                        pid = line.strip().split()[-1]
                        if pid != current_pid:  # Не убиваем сам launcher
                            subprocess.run(['taskkill', '/F', '/PID', pid], 
                                        stderr=subprocess.DEVNULL, check=False)
            except:
                pass
        
        time.sleep(1)  # Короткая пауза
    
    def install_dependencies(self):
        """Установка зависимостей"""
        print(f"\n{Colors.YELLOW}📦 Установка зависимостей...{Colors.END}")
        
        try:
            # Создание виртуального окружения
            print(f"{Colors.CYAN}🐍 Создание Python виртуального окружения...{Colors.END}")
            venv_path = self.root_dir / 'venv'
            if not venv_path.exists():
                subprocess.run([sys.executable, '-m', 'venv', 'venv'], 
                             cwd=self.root_dir, check=True)
            
            # Пути для Windows
            pip_path = venv_path / 'Scripts' / 'pip.exe'
            python_path = venv_path / 'Scripts' / 'python.exe'
            
            print(f"{Colors.CYAN}📋 Установка Python зависимостей...{Colors.END}")
            subprocess.run([str(pip_path), 'install', '-r', 'requirements.txt'], 
                         cwd=self.root_dir, check=True)
            
            # Node.js зависимости
            print(f"{Colors.CYAN}📦 Установка Node.js зависимостей...{Colors.END}")
            sensor_app_path = self.root_dir / 'sensor-app'
            subprocess.run(['npm', 'install'], cwd=sensor_app_path, check=True)
            
            # Запуск базы данных
            print(f"{Colors.CYAN}🗄️ Запуск базы данных PostgreSQL...{Colors.END}")
            subprocess.run(['docker-compose', 'up', '-d'], cwd=self.root_dir, check=True)
            
            # Ожидание запуска БД
            print(f"{Colors.YELLOW}⏳ Ожидание готовности базы данных (10 сек)...{Colors.END}")
            time.sleep(10)
            
            # Инициализация БД
            print(f"{Colors.CYAN}🔧 Инициализация таблиц базы данных...{Colors.END}")
            subprocess.run([str(python_path), 'db_init.py'], 
                         cwd=self.root_dir, check=True)
            
            print(f"{Colors.GREEN}✅ Установка успешно завершена!{Colors.END}")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"{Colors.RED}❌ Ошибка установки: {e}{Colors.END}")
            return False
        except Exception as e:
            print(f"{Colors.RED}❌ Неожиданная ошибка: {e}{Colors.END}")
            return False
    
    def start_application(self):
        """Запуск приложения"""
        print(f"\n{Colors.BLUE}🚀 Запуск MIMICS...{Colors.END}")
        
        # Агрессивная очистка всех процессов
        self.kill_processes_on_ports()
        
        try:
            # Запуск базы данных
            print(f"{Colors.CYAN}🗄️ Проверка базы данных...{Colors.END}")
            subprocess.run(['docker-compose', 'up', '-d'], cwd=self.root_dir)
            time.sleep(3)
            
            # Пути для виртуального окружения Windows
            venv_path = self.root_dir / 'venv'
            python_path = venv_path / 'Scripts' / 'python.exe'
            
            # Запуск backend БЕЗ отдельной консоли
            print(f"{Colors.CYAN}🔧 Запуск Backend API (порт 8000)...{Colors.END}")
            self.backend_process = subprocess.Popen([
                str(python_path), '-m', 'uvicorn', 'api.main:app', 
                '--reload', '--host', '0.0.0.0', '--port', '8000'
            ], cwd=self.root_dir, 
               stdout=subprocess.DEVNULL, 
               stderr=subprocess.DEVNULL)
            
            # Пауза для запуска API
            time.sleep(5)
            
            # Запуск frontend БЕЗ отдельной консоли
            print(f"{Colors.CYAN}🎨 Запуск Frontend React (порт 3000)...{Colors.END}")
            sensor_app_path = self.root_dir / 'sensor-app'
            
            # Устанавливаем переменную окружения чтобы React не открывался автоматически
            env = os.environ.copy()
            env['BROWSER'] = 'none'
            
            self.frontend_process = subprocess.Popen(
                'npm.cmd start', 
                cwd=sensor_app_path,
                shell=True,
                stdout=subprocess.DEVNULL, 
                stderr=subprocess.DEVNULL,
                env=env
            )
            
            # Ожидание полного запуска
            print(f"{Colors.YELLOW}⏳ Ожидание полного запуска приложения...{Colors.END}")
            time.sleep(10)
            
            # Успешный запуск
            success_msg = f"""
{Colors.GREEN}✅ MIMICS успешно запущен!{Colors.END}

{Colors.BOLD}🌐 Ссылки для доступа:{Colors.END}
   Frontend:     http://localhost:3000
   Backend API:  http://localhost:8000
   API Docs:     http://localhost:8000/docs

{Colors.BLUE}🔗 Открытие приложения в браузере...{Colors.END}
"""
            print(success_msg)
            
            # Открытие в браузере
            webbrowser.open('http://localhost:3000')
            
            return True
            
        except Exception as e:
            print(f"{Colors.RED}❌ Ошибка запуска: {e}{Colors.END}")
            return False
    
    def wait_for_exit(self):
        """Ожидание сигнала завершения"""
        try:
            print(f"\n{Colors.YELLOW}⏹️  Для остановки приложения нажмите Ctrl+C{Colors.END}")
            print(f"{Colors.CYAN}📊 Приложение работает в фоновом режиме...{Colors.END}")
            
            # Бесконечное ожидание
            while True:
                time.sleep(1)
                
        except KeyboardInterrupt:
            self.stop_application()
    
    def stop_application(self):
        """Остановка приложения"""
        print(f"\n{Colors.YELLOW}🛑 Остановка MIMICS...{Colors.END}")
        
        # Остановка процессов
        if self.backend_process:
            print(f"{Colors.CYAN}🔧 Остановка Backend...{Colors.END}")
            self.backend_process.terminate()
            try:
                self.backend_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self.backend_process.kill()
        
        if self.frontend_process:
            print(f"{Colors.CYAN}🎨 Остановка Frontend...{Colors.END}")
            self.frontend_process.terminate()
            try:
                self.frontend_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self.frontend_process.kill()
        
        # Принудительная очистка портов и процессов
        self.kill_processes_on_ports()
        
        # Остановка Docker контейнеров
        print(f"{Colors.CYAN}🗄️ Остановка базы данных...{Colors.END}")
        try:
            subprocess.run(['docker-compose', 'stop'], cwd=self.root_dir, 
                         timeout=10, check=False)
        except subprocess.TimeoutExpired:
            pass
        
        print(f"{Colors.GREEN}✅ MIMICS полностью остановлен{Colors.END}")
    
    def clean_system(self):
        """Полная очистка системы"""
        print(f"{Colors.YELLOW}🧹 ОЧИСТКА СИСТЕМЫ MIMICS{Colors.END}")
        print()
        print(f"{Colors.RED}⚠️  ВНИМАНИЕ: Это удалит все данные и настройки!{Colors.END}")
        print()
        print("Что будет удалено:")
        print("- Виртуальное окружение Python (venv/)")
        print("- Node.js зависимости (sensor-app/node_modules/)")
        print("- Docker контейнеры и данные")
        print("- Все данные базы данных")
        print()
        
        confirm = input(f"{Colors.YELLOW}Продолжить очистку? (y/N): {Colors.END}")
        if confirm.lower() != 'y':
            print("Очистка отменена")
            return
        
        print(f"\n{Colors.BLUE}Начинаю очистку...{Colors.END}")
        
        # Остановка всех процессов
        print(f"{Colors.CYAN}🛑 Остановка всех процессов...{Colors.END}")
        self.stop_application()
        
        # Дополнительная очистка процессов Windows
        try:
            subprocess.run(['taskkill', '/f', '/im', 'python.exe'], 
                         stderr=subprocess.DEVNULL, check=False)
            subprocess.run(['taskkill', '/f', '/im', 'node.exe'], 
                         stderr=subprocess.DEVNULL, check=False)
            subprocess.run(['taskkill', '/f', '/im', 'uvicorn.exe'], 
                         stderr=subprocess.DEVNULL, check=False)
        except:
            pass
        
        # Удаление Docker контейнеров и данных
        print(f"{Colors.CYAN}🐳 Удаление Docker контейнеров и данных...{Colors.END}")
        try:
            subprocess.run(['docker-compose', 'down', '-v'], cwd=self.root_dir, 
                         stderr=subprocess.DEVNULL, check=False)
            subprocess.run(['docker', 'system', 'prune', '-f'], 
                         stderr=subprocess.DEVNULL, check=False)
        except:
            pass
        
        # Удаление виртуального окружения Python
        print(f"{Colors.CYAN}🐍 Удаление виртуального окружения Python...{Colors.END}")
        venv_path = self.root_dir / 'venv'
        if venv_path.exists():
            try:
                import shutil
                shutil.rmtree(venv_path)
                print(f"    {Colors.GREEN}✅ venv удален{Colors.END}")
            except Exception as e:
                print(f"    {Colors.YELLOW}⚠️ Не удалось удалить venv: {e}{Colors.END}")
        
        # Удаление Node.js зависимостей
        print(f"{Colors.CYAN}📦 Удаление Node.js зависимостей...{Colors.END}")
        node_modules_path = self.root_dir / 'sensor-app' / 'node_modules'
        if node_modules_path.exists():
            try:
                import shutil
                shutil.rmtree(node_modules_path)
                print(f"    {Colors.GREEN}✅ node_modules удален{Colors.END}")
            except Exception as e:
                print(f"    {Colors.YELLOW}⚠️ Не удалось удалить node_modules: {e}{Colors.END}")
        
        # Удаление временных файлов
        print(f"{Colors.CYAN}🗑️ Удаление временных файлов...{Colors.END}")
        temp_patterns = ['*.log', '*.tmp', '__pycache__']
        for pattern in temp_patterns:
            try:
                import glob
                for file in glob.glob(str(self.root_dir / '**' / pattern), recursive=True):
                    os.remove(file)
            except:
                pass
        
        print(f"\n{Colors.GREEN}✅ ОЧИСТКА ЗАВЕРШЕНА{Colors.END}")
        print(f"Система полностью очищена")
        print(f"Для повторной установки запустите: {Colors.BOLD}python launcher.py{Colors.END}")
        print()
    
    def show_help(self):
        """Показать справку"""
        help_text = f"""
{Colors.BOLD}MIMICS Launcher - Универсальный лаунчер для Windows{Colors.END}

{Colors.YELLOW}Использование:{Colors.END}
  python launcher.py              # Запуск приложения (по умолчанию)
  python launcher.py --clean      # Полная очистка системы
  python launcher.py --help       # Показать эту справку

{Colors.YELLOW}Описание режимов:{Colors.END}
  {Colors.GREEN}Обычный запуск{Colors.END}  - Проверит зависимости, установит при необходимости,
                      запустит приложение и откроет в браузере
  
  {Colors.RED}Очистка{Colors.END}        - Удалит все установленные зависимости, данные
                      и контейнеры. Используйте при проблемах.

{Colors.YELLOW}Примеры:{Colors.END}
  python launcher.py              # Запустить MIMICS
  python launcher.py --clean      # Очистить и переустановить

{Colors.YELLOW}Требования:{Colors.END}
  - Docker Desktop для Windows
  - Python 3.9-3.12 (рекомендуется 3.11)
  - Node.js 16+ для Windows

{Colors.YELLOW}Примечания:{Colors.END}
  - Приложение работает в фоновом режиме
  - Никаких отдельных CMD окон
  - Автоматическая очистка портов при запуске
"""
        print(help_text)
    
    def run(self, args):
        """Главный метод запуска лаунчера"""
        self.print_banner()
        
        # Обработка аргументов
        if args.clean:
            self.clean_system()
            return
        
        if args.help:
            self.show_help()
            return
        
        # Проверка зависимостей
        if not self.check_dependencies():
            print(f"\n{Colors.RED}❌ Установите отсутствующие зависимости и запустите заново{Colors.END}")
            input(f"{Colors.YELLOW}Нажмите Enter для выхода...{Colors.END}")
            return
        
        # Проверка необходимости установки
        venv_exists = (self.root_dir / 'venv').exists()
        node_modules_exists = (self.root_dir / 'sensor-app' / 'node_modules').exists()
        
        if not venv_exists or not node_modules_exists:
            print(f"\n{Colors.YELLOW}🔧 Обнаружена первая установка или отсутствуют зависимости{Colors.END}")
            if not self.install_dependencies():
                input(f"{Colors.YELLOW}Нажмите Enter для выхода...{Colors.END}")
                return
        
        # Запуск приложения
        if self.start_application():
            self.wait_for_exit()
        else:
            input(f"{Colors.YELLOW}Нажмите Enter для выхода...{Colors.END}")

def main():
    """Точка входа в программу"""
    parser = argparse.ArgumentParser(
        description='MIMICS Launcher - Универсальный лаунчер для системы имитации датчиков (Windows)',
        add_help=False  # Отключаем стандартную справку, используем свою
    )
    parser.add_argument('--clean', action='store_true', 
                       help='Полная очистка системы (удаление всех зависимостей и данных)')
    parser.add_argument('--help', action='store_true',
                       help='Показать справку')
    
    args = parser.parse_args()
    
    launcher = MimicsLauncher()
    
    # Обработка сигналов для корректного завершения
    def signal_handler(sig, frame):
        launcher.stop_application()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    launcher.run(args)

if __name__ == '__main__':
    main()