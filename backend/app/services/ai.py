from google import genai
from app.core.config import settings
import json
import logging
import os
import requests
import base64
from typing import Optional

logger = logging.getLogger(__name__)

# Initialize the client with fallbacks. Catch initialization errors to prevent server startup crashes.
api_key = settings.openai_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
client = None

try:
    if api_key and not api_key.startswith("sk-"):
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

def get_ai_provider() -> str:
    key = settings.openai_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if key and key.startswith("sk-"):
        return "openai"
    if os.environ.get("OPENAI_API_KEY") and os.environ.get("OPENAI_API_KEY").startswith("sk-"):
        return "openai"
    return "gemini"

def handle_ai_error(e: Exception):
    error_msg = str(e)
    from fastapi import HTTPException
    
    # Catch Rate Limit / Quota Exceeded error
    if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg or "quota" in error_msg.lower():
        raise HTTPException(
            status_code=429,
            detail="AI API daily quota exceeded. If you are using the free tier, please set or update your own GEMINI_API_KEY or OPENAI_API_KEY in the backend settings."
        )
    raise HTTPException(
        status_code=500,
        detail=f"AI operation failed: {error_msg}"
    )

def generate_study_content(title: str, content: Optional[str], resource_type: str, language: str = "English") -> list[str]:
    """
    Generates educational content for a given title, content, and resource type.
    """
    context = content if content else f"the topic '{title}'"
    
    if resource_type == "notes":
        prompt = f"You are an expert tutor. I am studying '{title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, create structured study notes. Provide key concepts, definitions, and brief explanations. Return a JSON array of strings, where each string is a separate bullet point or paragraph of the notes."
    elif resource_type == "flashcards":
        prompt = f"You are an expert tutor. I am studying '{title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, generate a set of flashcards. Return a JSON array of strings, where each string is strictly formatted as 'Q: <question> | A: <answer>'."
    elif resource_type == "quiz":
        prompt = f"You are an expert tutor. I am studying '{title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, generate a multiple-choice practice quiz. Return a JSON array of strings, where each string is strictly formatted exactly as 'Q: <question> | O: <option1>, <option2>, <option3>, <option4> | A: <exact_text_of_correct_option>'."
    elif resource_type == "mindmap":
        prompt = f"You are an expert tutor. I am studying '{title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, create a mind map representing the key concepts and their relationships. Return a JSON array containing exactly one string: the raw mermaid.js graph syntax (e.g. 'graph TD\\n A-->B'). Do NOT wrap it in markdown code blocks."
    elif resource_type == "podcast":
        prompt = f"You are an expert tutor. I am studying '{title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, generate an engaging, natural-sounding audio script/dialogue between two co-hosts discussing this material: Host A (the expert) and Host B (the curious student/co-host). Make sure the co-hosts explain and summarize the material thoroughly. Return a JSON array of strings, where each string is strictly formatted exactly as either 'Host A: <dialogue_text>' or 'Host B: <dialogue_text>'."
    elif resource_type == "summary":
        prompt = f"You are an expert tutor. I am studying '{title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, generate a highly detailed, comprehensive, and structured summary. Use beautiful Markdown formatting including headers (h2, h3), bold text, bullet points, numbered lists, tables where relevant, and blockquotes. Make the content extremely clear, understandable, and formatted like a premium GPT-4 answer. Return a JSON array containing exactly one string: the entire generated Markdown document."
    else:
        prompt = f"You are an expert tutor. I am studying '{title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, generate a summary of the most important aspects. Return a JSON array of strings summarizing the material."

    prompt += f"\n\nImportant: You must generate the final output entirely in the {language} language."

    provider = get_ai_provider()
    
    if provider == "openai":
        try:
            key = os.environ.get("OPENAI_API_KEY") or settings.openai_api_key
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a helpful study tutor. You must output a JSON array of strings, and nothing else. Do not wrap the JSON inside markdown code blocks."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"}
            }
            res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            res.raise_for_status()
            res_data = res.json()
            raw_text = res_data["choices"][0]["message"]["content"].strip()
            
            # Parse the JSON response
            parsed = json.loads(raw_text)
            # Sometimes OpenAI wraps the array inside a dictionary, e.g., {"result": [...]} or {"content": [...]}
            if isinstance(parsed, dict):
                for val in parsed.values():
                    if isinstance(val, list):
                        return val
            if isinstance(parsed, list):
                return parsed
            return [str(parsed)]
        except Exception as e:
            logger.error(f"Error generating content via OpenAI: {e}")
            handle_ai_error(e)
            
    else:
        # Gemini flow
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
            parsed = json.loads(response.text)
            if isinstance(parsed, list):
                return parsed
            return [str(parsed)]
        except Exception as e:
            logger.error(f"Error generating content via Gemini: {e}")
            handle_ai_error(e)

def ask_ai_tutor(question: str, materials: list[tuple[str, Optional[str]]]) -> tuple[str, list[str]]:
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
    
    provider = get_ai_provider()
    
    if provider == "openai":
        try:
            key = os.environ.get("OPENAI_API_KEY") or settings.openai_api_key
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            res.raise_for_status()
            res_data = res.json()
            answer = res_data["choices"][0]["message"]["content"]
            return (answer, material_titles)
        except Exception as e:
            logger.error(f"Error asking OpenAI tutor: {e}")
            handle_ai_error(e)
    else:
        try:
            response = get_ai_client().models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            return (response.text, material_titles)
        except Exception as e:
            logger.error(f"Error asking Gemini tutor: {e}")
            handle_ai_error(e)

def solve_image_doubt(image_bytes: bytes, mime_type: str, question: str) -> str:
    """
    Solves a doubt based on an uploaded image and an optional question.
    Uses multimodal capabilities of OpenAI or Gemini.
    """
    prompt = f"You are an expert tutor. Please analyze this image and help me solve my doubt. {question}"
    
    provider = get_ai_provider()
    
    if provider == "openai":
        try:
            key = os.environ.get("OPENAI_API_KEY") or settings.openai_api_key
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ]
            }
            res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            res.raise_for_status()
            res_data = res.json()
            return res_data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Error solving image doubt via OpenAI: {e}")
            handle_ai_error(e)
    else:
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
            logger.error(f"Error solving image doubt via Gemini: {e}")
            handle_ai_error(e)

def transcribe_media(media_bytes: bytes, mime_type: str) -> str:
    """
    Transcribes audio or video media using OpenAI Whisper or Gemini.
    """
    provider = get_ai_provider()
    
    if provider == "openai":
        try:
            key = os.environ.get("OPENAI_API_KEY") or settings.openai_api_key
            headers = {
                "Authorization": f"Bearer {key}"
            }
            
            # Determine extension
            ext = "mp3"
            if "wav" in mime_type:
                ext = "wav"
            elif "mp4" in mime_type:
                ext = "mp4"
            elif "mpeg" in mime_type:
                ext = "mpeg"
                
            files = {
                "file": (f"audio.{ext}", media_bytes, mime_type),
                "model": (None, "whisper-1")
            }
            res = requests.post("https://api.openai.com/v1/audio/transcriptions", headers=headers, files=files)
            res.raise_for_status()
            return res.json().get("text", "")
        except Exception as e:
            logger.error(f"Error transcribing audio via OpenAI: {e}")
            handle_ai_error(e)
    else:
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
            logger.error(f"Error transcribing media via Gemini: {e}")
            handle_ai_error(e)
