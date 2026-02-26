from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass

from dotenv import load_dotenv

from .tools.generate_vine_branches import generate_vine_branches


@dataclass
class GenerateVineBranchesInput:
    parent_id: str
    parent_content: str
    parent_x: float
    parent_y: float


def main() -> None:
    """Simple CLI harness for the `generate_vine_branches` MCP tool.

    Usage (from ai-engine folder):

        python -m src.main

    Make sure MISTRAL_API_KEY is set in your environment or `.env`.
    """

    # Load .env from project root if present
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

    example = GenerateVineBranchesInput(
        parent_id="root",
        parent_content="Brainstorm ways to grow an AI-native brainstorming tool called Vineforge.",
        parent_x=0.0,
        parent_y=0.0,
    )

    result = generate_vine_branches(
        parent_id=example.parent_id,
        parent_content=example.parent_content,
        parent_x=example.parent_x,
        parent_y=example.parent_y,
    )

    print(json.dumps({"input": asdict(example), "output": result}, indent=2))


if __name__ == "__main__":
    main()
