"""
ComfyUI-Title-Memo — Canvas Annotation Node
纯前端实现，Python 仅负责节点注册。
作者: 穿山阅海 | 版本: 2.0
COPYRIGHT © WOS AI STUDIO | 穿山阅海
"""


class TitleMemo:
    """画布注释节点 — 无输入输出端口，所有渲染与交互由前端 JS 处理。"""

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {}}

    RETURN_TYPES = ()
    OUTPUT_NODE = False
    FUNCTION = "execute"
    CATEGORY = "⚡️穿山阅海"
    DESCRIPTION = "信息注释节点"

    def execute(self):
        return ()


NODE_CLASS_MAPPINGS = {
    "Title_Memo": TitleMemo,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Title_Memo": "Title Memo",
}
