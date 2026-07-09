from google import genai
from app.core.config import settings
import json
import logging

logger = logging.getLogger(__name__)

import os

# Initialize the client with fallbacks. Catch initialization errors to prevent server startup crashes.
api_key = settings.openai_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
client = None

try:
    if api_key:
        client = genai.Client(api_key=api_key)
    else:
        # Fallback to default environment lookup
        client = genai.Client()
except Exception as e:
    logger.warning(f"GenAI Client initialization deferred: {e}. Set GEMINI_API_KEY to enable AI features.")

def get_ai_client():
    if client is None:
        raise ValueError("Gemini API Key is not configured. Please set the GEMINI_API_KEY environment variable in your backend settings.")
    return client

def generate_study_content(title: str, content: str | None, resource_type: str, language: str = "English") -> list[str]:
    """
    Generates educational content for a given title, content, and resource type.
    """
    context = content if content else f"the topic '{title}'"
    prompt = f"You are an expert tutor. I am studying '{title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, create a list of {resource_type}. "
    
    if resource_type == "notes":
        prompt += "Provide key concepts, definitions, and brief explanations. Return an array of strings, where each string is a bullet point."
    elif resource_type == "flashcards":
        prompt += "Provide flashcards in a Q&A format. Return an array of strings, where each string is formatted as 'Q: <question> | A: <answer>'."
    elif resource_type == "quiz":
        prompt += "Provide a multiple-choice quiz. Return an array of strings, where each string is strictly formatted exactly as 'Q: <question> | O: <option1>, <option2>, <option3>, <option4> | A: <exact_text_of_correct_option>'."
    elif resource_type == "mindmap":
        prompt += "Create a mind map representing the key concepts and their relationships. Return an array containing exactly one string: the raw mermaid.js graph syntax (e.g. 'graph TD\\n A-->B'). Do NOT wrap it in markdown code blocks."
    elif resource_type == "podcast":
        prompt += "Create an engaging, natural-sounding audio script/dialogue between two co-hosts: Host A (the expert) and Host B (the curious co-host), discussing the material. Return an array of strings, where each string is strictly formatted exactly as either 'Host A: <dialogue_text>' or 'Host B: <dialogue_text>'."
    else:
        prompt += "Return an array of strings summarizing the most important aspects."

    prompt += f"\n\nImportant: You must generate the final output entirely in the {language} language."

    # Using Structured Outputs (JSON Schema) to guarantee an array of strings
    try:
        response = get_ai_client().models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "array",
                    "items": {"type": "string"},
                },
            ),
        )
        # Parse the JSON response
        parsed = json.loads(response.text)
        if isinstance(parsed, list):
            return parsed
        return [str(parsed)]
    except Exception as e:
        logger.error(f"Error generating content: {e}")
        return ["Failed to generate content. Please try again later.", str(e)]

def ask_ai_tutor(question: str, materials: list[tuple[str, str | None]]) -> tuple[str, list[str]]:
    """
    Answers a question based on the provided materials [(title, content)].
    Returns a tuple of (answer, sources).
    """
    material_texts = "\n\n".join([f"--- {title} ---\n{content if content else 'No content provided.'}" for title, content in materials])
    material_titles = [m[0] for m in materials]
    
    prompt = (
        f"You are a helpful AI tutor. A student is asking: '{question}'.\n"
        f"They are currently studying the following materials:\n\n{material_texts}\n\n"
        "Provide a clear, educational answer based on the materials provided."
    )
    
    try:
        response = get_ai_client().models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return (response.text, material_titles)
    except Exception as e:
        logger.error(f"Error asking tutor: {e}")
        return ("Sorry, I couldn't process your question at the moment.", [])

def solve_image_doubt(image_bytes: bytes, mime_type: str, question: str) -> str:
    """
    Solves a doubt based on an uploaded image and an optional question.
    Uses Gemini's multimodal capabilities.
    """
    prompt = f"You are an expert tutor. Please analyze this image and help me solve my doubt. {question}"
    
    try:
        response = get_ai_client().models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                {
                    "mime_type": mime_type,
                    "data": image_bytes
                }
            ]
        )
        return response.text
    except Exception as e:
        logger.error(f"Error solving image doubt: {e}")
        return "Sorry, I could not process this image right now. Please try again later."

def transcribe_media(media_bytes: bytes, mime_type: str) -> str:
    """
    Transcribes audio or video media using Gemini.
    """
    prompt = "Please provide a highly detailed transcription of this audio/video lecture. If it is long, also provide a short summary of the key points."
    
    try:
        response = get_ai_client().models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                {
                    "mime_type": mime_type,
                    "data": media_bytes
                }
            ]
        )
        return response.text
    except Exception as e:
        logger.error(f"Error transcribing media: {e}")
        return ""
