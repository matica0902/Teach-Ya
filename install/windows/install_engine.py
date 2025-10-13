#!/usr/bin/env python3
"""
UI CoreWork 安裝引擎
通用安裝框架，支持配置驅動的安裝流程
"""

import json
import os
import sys
import subprocess
import platform
import shutil
import time
from pathlib import Path
from typing import Dict, Any, Optional, List
import urllib.request
import tempfile


class InstallEngine:
    """通用安裝引擎"""

    def __init__(self, config_file: str = "install_config.json"):
        self.config = self.load_config(config_file)
        self.system = platform.system().lower()
        self.is_windows = self.system == "windows"
        self.is_admin = self.check_admin_rights()

    def load_config(self, config_file: str) -> Dict[str, Any]:
        """載入安裝配置"""
        if not os.path.exists(config_file):
            raise FileNotFoundError(f"配置文件 {config_file} 不存在")

        with open(config_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def check_admin_rights(self) -> bool:
        """檢查管理員權限"""
        try:
            if self.is_windows:
                import ctypes
                return ctypes.windll.shell32.IsUserAnAdmin() != 0
            else:
                return os.geteuid() == 0
        except:
            return False

    def run_command(self, cmd: List[str], cwd: Optional[str] = None,
                   capture_output: bool = False) -> subprocess.CompletedProcess:
        """執行系統命令"""
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd,
                capture_output=capture_output,
                text=True,
                check=True
            )
            return result
        except subprocess.CalledProcessError as e:
            print(f"命令執行失敗: {' '.join(cmd)}")
            print(f"錯誤信息: {e.stderr}")
            raise

    def check_python(self) -> bool:
        """檢查 Python 環境"""
        try:
            result = self.run_command([sys.executable, "--version"], capture_output=True)
            version = result.stdout.strip().split()[1]
            print(f"✅ 發現 Python {version}")

            # 檢查版本是否符合要求
            required = self.config["python"]["required_version"]
            major, minor = version.split('.')[:2]
            current_version = float(f"{major}.{minor}")

            if current_version < float(required):
                print(f"⚠️  Python 版本 {version} 低於要求 {required}")
                return False

            return True
        except:
            return False

    def install_python(self) -> bool:
        """安裝 Python"""
        if not self.is_windows:
            print("❌ 自動安裝 Python 僅支援 Windows")
            return False

        config = self.config["python"]
        url = config["download_url"]
        installer_path = os.path.join(tempfile.gettempdir(), "python_installer.exe")

        print(f"📥 下載 Python {config['recommended_version']}...")
        try:
            urllib.request.urlretrieve(url, installer_path)
            print("✅ 下載完成")
        except Exception as e:
            print(f"❌ 下載失敗: {e}")
            return False

        print("🔧 安裝 Python...")
        try:
            args = config["installer_args"].split()
            self.run_command([installer_path] + args)
            print("✅ Python 安裝完成")

            # 重新載入 PATH
            self.refresh_path()
            return True
        except Exception as e:
            print(f"❌ 安裝失敗: {e}")
            return False
        finally:
            # 清理安裝檔案
            if os.path.exists(installer_path):
                os.remove(installer_path)

    def refresh_path(self):
        """重新載入系統 PATH"""
        if self.is_windows:
            # Windows PATH 重新載入
            import winreg
            try:
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                                   r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment")
                path_value = winreg.QueryValueEx(key, "Path")[0]
                os.environ["PATH"] = path_value
                winreg.CloseKey(key)
            except:
                pass

    def create_virtualenv(self) -> bool:
        """建立虛擬環境"""
        venv_dir = self.config["directories"]["venv"]

        # 備份現有環境
        if os.path.exists(venv_dir):
            backup_dir = f"{venv_dir}{self.config['backup']['backup_suffix']}"
            if os.path.exists(backup_dir):
                shutil.rmtree(backup_dir)
            shutil.move(venv_dir, backup_dir)
            print(f"💾 已備份舊環境到 {backup_dir}")

        print("📦 建立虛擬環境...")
        try:
            self.run_command([sys.executable, "-m", "venv", venv_dir])
            print("✅ 虛擬環境建立完成")
            return True
        except Exception as e:
            print(f"❌ 虛擬環境建立失敗: {e}")
            return False

    def install_dependencies(self) -> bool:
        """安裝依賴套件"""
        venv_dir = self.config["directories"]["venv"]
        requirements_file = self.config["dependencies"]["requirements_file"]

        if not os.path.exists(requirements_file):
            print(f"❌ 找不到依賴檔案: {requirements_file}")
            return False

        # 啟動虛擬環境
        if self.is_windows:
            python_exe = os.path.join(venv_dir, "Scripts", "python.exe")
            pip_exe = os.path.join(venv_dir, "Scripts", "pip.exe")
        else:
            python_exe = os.path.join(venv_dir, "bin", "python")
            pip_exe = os.path.join(venv_dir, "bin", "pip")

        print("📦 安裝依賴套件...")
        try:
            # 升級 pip
            if self.config["dependencies"]["upgrade_pip"]:
                self.run_command([python_exe, "-m", "pip", "install", "--upgrade", "pip"])

            # 安裝依賴
            self.run_command([pip_exe, "install", "-r", requirements_file])
            print("✅ 依賴安裝完成")
            return True
        except Exception as e:
            print(f"❌ 依賴安裝失敗: {e}")
            return False

    def initialize_database(self) -> bool:
        """初始化資料庫"""
        db_config = self.config["database"]
        init_script = db_config["init_script"]

        if not os.path.exists(init_script):
            print(f"❌ 找不到資料庫初始化腳本: {init_script}")
            return False

        print("🗄️ 初始化資料庫...")
        try:
            # 備份現有資料庫
            db_file = db_config["data_file"]
            if os.path.exists(db_file):
                backup_file = f"{db_file}.backup"
                shutil.copy2(db_file, backup_file)
                print(f"💾 已備份資料庫到 {backup_file}")

            # 運行初始化腳本
            self.run_command([sys.executable, init_script, "create"])
            print("✅ 資料庫初始化完成")
            return True
        except Exception as e:
            print(f"❌ 資料庫初始化失敗: {e}")
            return False

    def create_shortcuts(self) -> bool:
        """建立捷徑"""
        if not self.is_windows:
            print("ℹ️ 捷徑建立僅支援 Windows")
            return True

        shortcut_config = self.config["shortcuts"]
        if not shortcut_config["desktop"]:
            return True

        try:
            import winshell
            from win32com.client import Dispatch

            desktop = winshell.desktop()
            shortcut_path = os.path.join(desktop, f"{shortcut_config['target_name']}.lnk")

            shell = Dispatch('WScript.Shell')
            shortcut = shell.CreateShortCut(shortcut_path)
            shortcut.Targetpath = os.path.abspath("start_windows.bat")
            shortcut.WorkingDirectory = os.getcwd()
            shortcut.save()

            print("✅ 桌面捷徑建立完成")
            return True
        except ImportError:
            print("⚠️ 無法建立捷徑 (缺少 pywin32 或 winshell)")
            return True
        except Exception as e:
            print(f"⚠️ 捷徑建立失敗: {e}")
            return True

    def validate_installation(self) -> bool:
        """驗證安裝"""
        print("🔍 驗證安裝...")

        checks = [
            ("虛擬環境", lambda: os.path.exists(self.config["directories"]["venv"])),
            ("依賴檔案", lambda: os.path.exists(self.config["dependencies"]["requirements_file"])),
            ("資料庫檔案", lambda: os.path.exists(self.config["database"]["data_file"])),
        ]

        all_passed = True
        for check_name, check_func in checks:
            try:
                if check_func():
                    print(f"✅ {check_name} 檢查通過")
                else:
                    print(f"❌ {check_name} 檢查失敗")
                    all_passed = False
            except Exception as e:
                print(f"❌ {check_name} 檢查錯誤: {e}")
                all_passed = False

        return all_passed

    def show_completion_message(self):
        """顯示完成訊息"""
        config = self.config
        print("")
        print("=" * 50)
        print(f"🎉 {config['project']['name']} 安裝完成！")
        print("=" * 50)
        print("")
        print(f"📂 服務器地址: http://{config['server']['host']}:{config['server']['port']}")
        print("🔧 功能包含:")

        for feature in config["features"]:
            print(f"   • {feature}")

        print("")
        print("💡 啟動方式:")
        if self.is_windows:
            print("   • 桌面捷徑: 雙擊 'UI CoreWork'")
            print("   • 命令列: start_windows.bat")
        else:
            print("   • 終端機: ./start_simple.sh")

    def install(self) -> bool:
        """執行完整安裝流程"""
        print(f"🎨 {self.config['project']['name']} - {self.config['project']['description']}")
        print("=" * 60)
        print("")

        steps = [
            ("檢查 Python", self.check_python),
            ("安裝 Python", self.install_python),
            ("建立虛擬環境", self.create_virtualenv),
            ("安裝依賴", self.install_dependencies),
            ("初始化資料庫", self.initialize_database),
            ("建立捷徑", self.create_shortcuts),
            ("驗證安裝", self.validate_installation),
        ]

        for step_name, step_func in steps:
            if step_func is None:
                continue

            try:
                if not step_func():
                    print(f"❌ 安裝失敗於步驟: {step_name}")
                    return False
            except Exception as e:
                print(f"❌ 安裝失敗於步驟: {step_name} - {e}")
                return False

        self.show_completion_message()
        return True


def main():
    """主函數"""
    try:
        engine = InstallEngine()
        success = engine.install()

        if success:
            print("")
            print("🚀 準備啟動應用程式...")
            if engine.config["server"]["auto_open_browser"]:
                time.sleep(engine.config["server"]["browser_delay"])
                import webbrowser
                webbrowser.open(f"http://{engine.config['server']['host']}:{engine.config['server']['port']}")

            # 啟動服務器
            if engine.is_windows:
                os.system("start_windows.bat")
            else:
                os.system("./start_simple.sh")
        else:
            print("")
            print("❌ 安裝失敗，請檢查錯誤訊息並重試")
            sys.exit(1)

    except Exception as e:
        print(f"❌ 安裝過程中發生嚴重錯誤: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
