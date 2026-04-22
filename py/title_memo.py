"""
ComfyUI-Title-Memo
A pure frontend node for canvas annotations.
The Python class exists only to register the node type.
All rendering and interaction is handled by the JavaScript extension.
"""


class TitleMemo:
    """
    A canvas annotation node with no inputs or outputs.
    Purely decorative/informational - used for adding notes and comments to workflows.
    """

    @classmethod
    def INPUT_TYPES(cls):
        """No inputs required - this is a pure annotation node."""
        return {
            "required": {},
        }

    RETURN_TYPES = ()
    OUTPUT_NODE = False
    FUNCTION = "execute"
    CATEGORY = "memo"
    DESCRIPTION = "Add richly styled titles, notes, and comments directly on your workflow canvas"

    def execute(self):
        """No-op execution - all functionality is frontend-only."""
        return ()


NODE_CLASS_MAPPINGS = {
    "ComfyUI-Title-Memo": TitleMemo,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ComfyUI-Title-Memo": "Title Memo",
}