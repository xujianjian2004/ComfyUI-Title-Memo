"""
ComfyUI-Title-Memo - Canvas Annotation Node
===========================================

一个轻量级的 ComfyUI 画布注释节点，提供丰富的样式设置和预设功能。

核心特性:
- 纯前端实现，Python 仅负责节点注册
- 支持透明背景、多行文本编辑
- 丰富的样式预设（大标题、小标题、备注等）
- 完整的样式序列化，支持工作流保存/加载
- 自定义预设持久化存储（localStorage）

技术架构:
- Python 端: 提供节点定义和注册
- JavaScript 端: 处理所有渲染和交互逻辑
- 样式数据通过 onSerialize/onConfigure 序列化到工作流 JSON

作者: 穿山阅海
版本: 1.0
许可证: MIT
"""


class TitleMemo:
    """
    Title Memo 节点 - 在工作流画布上添加样式丰富的标题、备注和注释。

    此节点为纯装饰性节点，无输入输出端口，仅用于在画布上显示文本注释。
    所有样式设置和交互逻辑均由前端 JavaScript 实现。
    """

    @classmethod
    def INPUT_TYPES(cls):
        """
        定义节点输入参数。

        返回:
            dict: 包含 required 键的字典，此节点无输入参数
        """
        return {"required": {}}

    # 节点配置常量
    RETURN_TYPES = ()           # 无输出类型
    OUTPUT_NODE = False         # 非输出节点
    FUNCTION = "execute"        # 执行方法名
    CATEGORY = "⚡️穿山阅海"      # 节点分类
    DESCRIPTION = "信息注释节点"

    def execute(self):
        """
        节点执行方法。

        由于此节点为纯前端实现，此方法仅返回空元组。
        所有实际功能均由 JavaScript 扩展处理。

        返回:
            tuple: 空元组
        """
        return ()


# 节点注册映射
# 保持名称与 JavaScript 端 NODE_TYPE 常量一致
NODE_CLASS_MAPPINGS = {
    "Title_Memo": TitleMemo,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Title_Memo": "Title Memo",
}