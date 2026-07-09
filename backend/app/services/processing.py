from __future__ import annotations

def chunk_text(text: str, chunk_size: int = 900) -> list[str]:
    words = text.split()
    chunks: list[str] = []

    for index in range(0, len(words), chunk_size):
        chunks.append(" ".join(words[index : index + chunk_size]))

    return chunks
