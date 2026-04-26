"""
ComfyUI-Title-Memo - 节点注册入口文件
=====================================

负责：
1. 导出 WEB_DIRECTORY（JavaScript 扩展目录）
2. 动态加载 py 目录下的节点模块
3. 注册 NODE_CLASS_MAPPINGS 和 NODE_DISPLAY_NAME_MAPPINGS

功能特性：
- 单击节点：进入文字编辑模式
- 双击节点：打开样式编辑器
- 拖拽边缘：手动调整节点宽度与高度

作者: 穿山阅海
版本: 1.0
"""

import os
import sys
import importlib

# 获取当前插件根目录的绝对路径
file_directory = os.path.dirname(os.path.abspath(__file__))

# 定义 JavaScript 扩展目录路径
# ComfyUI 会自动加载此目录下的 JavaScript 文件
WEB_DIRECTORY = os.path.join(file_directory, "js")

# 节点注册映射字典（将在 _load_nodes 中填充）
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}


def _load_nodes():
    """
    动态加载 py 目录下的所有节点模块。
    
    遍历 py 目录，导入所有 .py 文件（排除 __init__.py），
    并将模块中的 NODE_CLASS_MAPPINGS 和 NODE_DISPLAY_NAME_MAPPINGS
    合并到全局映射字典中。
    """
    py_dir = os.path.join(file_directory, "py")
    
    # 如果 py 目录不存在，直接返回
    if not os.path.exists(py_dir):
        return
    
    # 将 py 目录添加到 Python 路径
    if py_dir not in sys.path:
        sys.path.insert(0, py_dir)
    
    # 遍历 py 目录下的所有文件
    for filename in os.listdir(py_dir):
        # 跳过非 .py 文件和 __init__.py
        if not filename.endswith(".py") or filename == "__init__.py":
            continue
        
        # 获取模块名（去除 .py 后缀）
        module_name = filename[:-3]
        
        try:
            # 动态导入模块
            module = importlib.import_module(module_name)
            
            # 合并节点类映射
            if hasattr(module, "NODE_CLASS_MAPPINGS"):
                NODE_CLASS_MAPPINGS.update(module.NODE_CLASS_MAPPINGS)
            
            # 合并节点显示名称映射
            if hasattr(module, "NODE_DISPLAY_NAME_MAPPINGS"):
                NODE_DISPLAY_NAME_MAPPINGS.update(module.NODE_DISPLAY_NAME_MAPPINGS)
        
        except Exception as e:
            # 捕获并打印导入错误
            print(f"[ComfyUI-Title-Memo] Failed to load {filename}: {e}")


# 模块加载时自动执行
_load_nodes()    # 加载节点模块

# 导出公共接口
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]