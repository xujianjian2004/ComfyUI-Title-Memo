"""
ComfyUI-Title-Memo — 节点注册入口
作者: 穿山阅海 | 版本: 2.0
COPYRIGHT © WOS AI STUDIO | 穿山阅海
"""

import os
import importlib

WEB_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "js")

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}


def _load_nodes():
    """动态加载 py/ 目录下的所有节点模块，合并映射到全局字典。"""
    py_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "py")
    if not os.path.isdir(py_dir):
        return

    for fn in os.listdir(py_dir):
        if not fn.endswith(".py") or fn.startswith("_"):
            continue
        try:
            mod = importlib.import_module(f".py.{fn[:-3]}", package=__package__)
            if hasattr(mod, "NODE_CLASS_MAPPINGS"):
                NODE_CLASS_MAPPINGS.update(mod.NODE_CLASS_MAPPINGS)
            if hasattr(mod, "NODE_DISPLAY_NAME_MAPPINGS"):
                NODE_DISPLAY_NAME_MAPPINGS.update(mod.NODE_DISPLAY_NAME_MAPPINGS)
        except Exception as e:
            print(f"[ComfyUI-Title-Memo] Failed to load {fn}: {e}")


_load_nodes()

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
