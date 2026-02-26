from __future__ import annotations

import os

from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

from .tools.generate_vine_branches import generate_vine_branches


class GenerateRequest(BaseModel):
    parent_id: str
    parent_content: str
    parent_x: float
    parent_y: float


class GenerateResponse(BaseModel):
    nodes: list[dict]
    edges: list[dict]


load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=False)

app = FastAPI(title="Vineforge AI Engine")


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.post("/forge", response_model=GenerateResponse)
async def forge(req: GenerateRequest) -> GenerateResponse:
    result = generate_vine_branches(
        parent_id=req.parent_id,
        parent_content=req.parent_content,
        parent_x=req.parent_x,
        parent_y=req.parent_y,
    )
    return GenerateResponse(nodes=result["nodes"], edges=result["edges"])
