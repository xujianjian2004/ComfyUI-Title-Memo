import os
import sys
import importlib

python = sys.executable
file_directory = os.path.dirname(os.path.abspath(__file__))
WEB_DIRECTORY = os.path.join(file_directory, "js")

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}


def _print_logo():
    CYAN = "\033[38;5;51m"
    PINK = "\033[38;5;201m"
    RESET = "\033[0m"
    print()
    print(f"{PINK}╔══════════════════════════════════════════╗{RESET}")
    print(f"{PINK}║ {CYAN}✦ ComfyUI-Title-Memo ✦ 「穿山阅海」制作 {PINK} ║{RESET}")
    print(f"{PINK}╚══════════════════════════════════════════╝{RESET}")
    print()


def _load_nodes():
    py_dir = os.path.join(file_directory, "py")
    if not os.path.exists(py_dir):
        return
    if py_dir not in sys.path:
        sys.path.insert(0, py_dir)
    for filename in os.listdir(py_dir):
        if not filename.endswith(".py") or filename == "__init__.py":
            continue
        module_name = filename[:-3]
        try:
            module = importlib.import_module(module_name)
            if hasattr(module, "NODE_CLASS_MAPPINGS"):
                NODE_CLASS_MAPPINGS.update(module.NODE_CLASS_MAPPINGS)
            if hasattr(module, "NODE_DISPLAY_NAME_MAPPINGS"):
                NODE_DISPLAY_NAME_MAPPINGS.update(module.NODE_DISPLAY_NAME_MAPPINGS)
        except Exception as e:
            print(f"[ComfyUI-Title-Memo] Failed to load {filename}: {e}")


_print_logo()
_load_nodes()

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]