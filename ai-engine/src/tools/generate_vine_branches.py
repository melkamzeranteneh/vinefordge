from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_mistralai.chat_models import ChatMistralAI

from .positioning import fan_out_positioning


class VineBranch(BaseModel):
    title: str = Field(..., description="Short title for the sub-idea")
    content: str = Field(..., description="1-3 sentence description of the sub-idea")


class VineBranches(BaseModel):
    branches: List[VineBranch]


def _build_llm() -> ChatMistralAI:
    """Create a Mistral chat LLM client using MISTRAL_API_KEY from env.

    This assumes the free Mistral API is available and the key is set
    in the environment (e.g. via `.env`).
    """

    # `model` can be adjusted; "mistral-small-latest" works on free tier.
    return ChatMistralAI(model="mistral-small-latest")


def generate_vine_branches(
    parent_id: str,
    parent_content: str,
    parent_x: float,
    parent_y: float,
) -> Dict[str, Any]:
    """MCP-style tool that grows the vine with 3 new branches.

    Parameters
    ----------
    parent_id:
        ID of the parent node on the canvas.
    parent_content:
        Text content of the parent node.
    parent_x, parent_y:
        Current coordinates of the parent node.

    Returns
    -------
    dict
        {"nodes": [...], "edges": [...]} in an xyflow-compatible shape.
    """

    llm = _build_llm()

    parser = JsonOutputParser(pydantic_object=VineBranches)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an AI brainstorming assistant for an infinite canvas tool. "
                "Given a parent idea, you propose three distinct, concise sub-ideas.\n"
                "Always respond in strict JSON format that matches the given schema.",
            ),
            (
                "user",
                "Parent idea text:\n{parent_content}\n\n"
                "Generate exactly 3 distinct next-step ideas that expand this thought.",
            ),
            ("system", "{format_instructions}"),
        ]
    ).partial(format_instructions=parser.get_format_instructions())

    chain = prompt | llm | parser

    branches: VineBranches = chain.invoke({"parent_content": parent_content})

    positions = fan_out_positioning(parent_node_x=parent_x, parent_node_y=parent_y, num_new_nodes=3)

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

    for idx, (branch, pos) in enumerate(zip(branches.branches, positions), start=1):
        node_id = f"{parent_id}-branch-{idx}"
        nodes.append(
            {
                "id": node_id,
                "type": "ai",
                "position": {"x": pos["x"], "y": pos["y"]},
                "data": {
                    "title": branch.title,
                    "content": branch.content,
                    "status": "idle",
                    "vectorId": "",  # can be filled after embedding
                },
            }
        )

        edge_id = f"{parent_id}-to-{node_id}"
        edges.append(
            {
                "id": edge_id,
                "source": parent_id,
                "target": node_id,
                "type": "default",
            }
        )

    return {"nodes": nodes, "edges": edges}
