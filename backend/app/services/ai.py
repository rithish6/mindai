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

def get_all_gemini_keys(custom_key: Optional[str] = None) -> list[str]:
    if custom_key:
        return [custom_key]
    
    # Read keys from GEMINI_API_KEYS (comma-separated list) or GEMINI_API_KEY
    keys_str = os.environ.get("GEMINI_API_KEYS") or os.environ.get("GEMINI_API_KEY") or ""
    if not keys_str and settings.openai_api_key and not settings.openai_api_key.startswith("sk-"):
        keys_str = settings.openai_api_key
        
    keys = [k.strip() for k in keys_str.replace(";", ",").split(",") if k.strip()]
    return keys

def execute_with_gemini_fallback(func, *args, custom_key: Optional[str] = None, **kwargs):
    keys = get_all_gemini_keys(custom_key)
    if not keys:
        if client:
            return func(client, *args, **kwargs)
        raise ValueError("No Gemini API keys are configured.")
        
    last_exception = None
    for key in keys:
        try:
            temp_client = genai.Client(api_key=key)
            return func(temp_client, *args, **kwargs)
        except Exception as e:
            err_msg = str(e)
            if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg or "quota" in err_msg.lower():
                logger.warning(f"Gemini API key rate limited or quota exceeded. Trying fallback key... Error: {e}")
                last_exception = e
                continue
            else:
                raise e
    raise last_exception

def get_ai_client(custom_gemini_key: Optional[str] = None):
    if custom_gemini_key:
        try:
            return genai.Client(api_key=custom_gemini_key)
        except Exception as e:
            logger.error(f"Failed to initialize custom GenAI Client: {e}")
            raise ValueError(f"Invalid custom Gemini API Key: {e}")
            
    if client is None:
        raise ValueError("Gemini API Key is not configured. Please set the GEMINI_API_KEY environment variable in your backend settings.")
    return client

def get_ai_provider(custom_gemini_key: Optional[str] = None, custom_openai_key: Optional[str] = None) -> str:
    if custom_openai_key:
        return "openai"
    if custom_gemini_key:
        return "gemini"
        
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

def generate_study_content(title: str, content: Optional[str], resource_type: str, language: str = "English", custom_gemini_key: Optional[str] = None, custom_openai_key: Optional[str] = None) -> list[str]:
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

    provider = get_ai_provider(custom_gemini_key, custom_openai_key)
    
    if provider == "openai":
        try:
            key = custom_openai_key or os.environ.get("OPENAI_API_KEY") or settings.openai_api_key
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
        # Gemini flow with fallback rotation
        def _generate(g_client):
            response = g_client.models.generate_content(
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

        try:
            return execute_with_gemini_fallback(_generate, custom_key=custom_gemini_key)
        except Exception as e:
            logger.error(f"Error generating content via Gemini: {e}")
            handle_ai_error(e)

MASTER_TUTOR_SYSTEM_PROMPT = (
    "You are SnapLearn AI, an elite, world-class personal AI tutor powered by top-tier reasoning capabilities matching GPT-4o and Gemini Pro.\n\n"
    "Your goal is to provide exceptional, thorough, highly accurate, and engaging educational responses that make complex subjects effortlessly understandable.\n\n"
    "STRICT OUTPUT REQUIREMENTS:\n"
    "1. 🎯 Clear Structure & Beautiful Formatting: Use rich Markdown formatting extensively. Structure your responses with clear headers (##, ###), bold key terms (**term**), clean bullet points, numbered step-by-step breakdowns, code blocks, callouts, and comparison tables where helpful.\n"
    "2. 💡 In-Depth & Intuitive Explanations: Never give brief or superficial answers. Break down complex logic step-by-step and explain the underlying reasoning.\n"
    "3. 📝 Real-World Examples & Analogies: Provide at least one clear, relatable real-world example or intuitive analogy for abstract concepts.\n"
    "4. 📌 Source Grounding & Citations: Ground your response in the provided study materials. Reference specific concepts using [Source: Title] where applicable.\n"
    "5. ❓ Proactive Follow-up Prompts: Conclude your answer with 2 relevant follow-up practice questions or prompts to deepen the student's mastery."
)

def ask_ai_tutor(
    question: str, 
    materials: list[tuple[str, Optional[str]]], 
    chat_history: Optional[list[dict]] = None,
    custom_gemini_key: Optional[str] = None, 
    custom_openai_key: Optional[str] = None
) -> tuple[str, list[str]]:
    """
    Answers a question based on the provided materials [(title, content)] and optional chat history.
    Returns a tuple of (answer, sources).
    """
    material_texts = "\n\n".join([f"--- Source: {title} ---\n{content if content else 'No content provided.'}" for title, content in materials])
    material_titles = [m[0] for m in materials]
    
    prompt = (
        f"A student is asking: '{question}'.\n\n"
        f"They are studying the following source materials:\n{material_texts}\n\n"
        "Provide a comprehensive, beautifully formatted educational answer adhering to SnapLearn AI tutor standards."
    )
    
    provider = get_ai_provider(custom_gemini_key, custom_openai_key)
    
    if provider == "openai":
        try:
            key = custom_openai_key or os.environ.get("OPENAI_API_KEY") or settings.openai_api_key
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            messages = [{"role": "system", "content": MASTER_TUTOR_SYSTEM_PROMPT}]
            if chat_history:
                for msg in chat_history[-6:]:
                    role = "user" if msg.get("role") in ["Student", "user"] else "assistant"
                    content = msg.get("text") or msg.get("content") or ""
                    if content:
                        messages.append({"role": role, "content": content})
            messages.append({"role": "user", "content": prompt})

            payload = {
                "model": "gpt-4o",
                "messages": messages,
                "temperature": 0.5
            }
            res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            if not res.ok:
                # Fallback to gpt-4o-mini if gpt-4o fails
                payload["model"] = "gpt-4o-mini"
                res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            res.raise_for_status()
            res_data = res.json()
            answer = res_data["choices"][0]["message"]["content"]
            return (answer, material_titles)
        except Exception as e:
            logger.error(f"Error asking OpenAI tutor: {e}")
            handle_ai_error(e)
    else:
        # Gemini flow with fallback rotation
        def _ask(g_client):
            contents = []
            if chat_history:
                for msg in chat_history[-6:]:
                    role = "user" if msg.get("role") in ["Student", "user"] else "model"
                    content = msg.get("text") or msg.get("content") or ""
                    if content:
                        contents.append({"role": role, "parts": [{"text": content}]})
            contents.append({"role": "user", "parts": [{"text": prompt}]})

            response = g_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents,
                config=genai.types.GenerateContentConfig(
                    system_instruction=MASTER_TUTOR_SYSTEM_PROMPT,
                    temperature=0.5
                )
            )
            return (response.text, material_titles)

        try:
            return execute_with_gemini_fallback(_ask, custom_key=custom_gemini_key)
        except Exception as e:
            logger.error(f"Error asking Gemini tutor: {e}")
            handle_ai_error(e)

def solve_image_doubt(image_bytes: bytes, mime_type: str, question: str, custom_gemini_key: Optional[str] = None, custom_openai_key: Optional[str] = None) -> str:
    """
    Solves a doubt based on an uploaded image and an optional question.
    Uses multimodal capabilities of OpenAI or Gemini.
    """
    prompt = (
        f"{MASTER_TUTOR_SYSTEM_PROMPT}\n\n"
        f"Analyze this image and solve the student's doubt. Question: {question if question else 'Explain and solve this problem step-by-step.'}"
    )
    
    provider = get_ai_provider(custom_gemini_key, custom_openai_key)
    
    if provider == "openai":
        try:
            key = custom_openai_key or os.environ.get("OPENAI_API_KEY") or settings.openai_api_key
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o",
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
            if not res.ok:
                payload["model"] = "gpt-4o-mini"
                res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            res.raise_for_status()
            res_data = res.json()
            return res_data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Error solving image doubt via OpenAI: {e}")
            handle_ai_error(e)
    else:
        # Gemini flow with fallback rotation
        def _solve(g_client):
            response = g_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    prompt,
                    {
                        "mime_type": mime_type,
                        "data": image_bytes
                    }
                ],
                config=genai.types.GenerateContentConfig(
                    system_instruction=MASTER_TUTOR_SYSTEM_PROMPT,
                    temperature=0.4
                )
            )
            return response.text

        try:
            return execute_with_gemini_fallback(_solve, custom_key=custom_gemini_key)
        except Exception as e:
            logger.error(f"Error solving image doubt via Gemini: {e}")
            handle_ai_error(e)

def transcribe_media(media_bytes: bytes, mime_type: str, custom_gemini_key: Optional[str] = None, custom_openai_key: Optional[str] = None) -> str:
    """
    Transcribes audio or video media using OpenAI Whisper or Gemini.
    """
    provider = get_ai_provider(custom_gemini_key, custom_openai_key)
    
    if provider == "openai":
        try:
            key = custom_openai_key or os.environ.get("OPENAI_API_KEY") or settings.openai_api_key
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
        # Gemini flow with fallback rotation
        prompt = "Please provide a highly detailed transcription of this audio/video lecture. If it is long, also provide a short summary of the key points."
        def _transcribe(g_client):
            response = g_client.models.generate_content(
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

        try:
            return execute_with_gemini_fallback(_transcribe, custom_key=custom_gemini_key)
        except Exception as e:
            logger.error(f"Error transcribing media via Gemini: {e}")
            handle_ai_error(e)

def call_openai_chat_stream(
    prompt: str, 
    system_message: Optional[str] = None, 
    chat_history: Optional[list[dict]] = None,
    custom_openai_key: Optional[str] = None
):
    key = custom_openai_key or os.environ.get("OPENAI_API_KEY") or settings.openai_api_key
    if not key:
        raise ValueError("OpenAI API Key is not configured. Please set the OPENAI_API_KEY environment variable.")
    
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    messages = []
    sys_msg = system_message or MASTER_TUTOR_SYSTEM_PROMPT
    messages.append({"role": "system", "content": sys_msg})
    
    if chat_history:
        for msg in chat_history[-6:]:
            role = "user" if msg.get("role") in ["Student", "user"] else "assistant"
            content = msg.get("text") or msg.get("content") or ""
            if content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": prompt})
    
    payload = {
        "model": "gpt-4o",
        "messages": messages,
        "temperature": 0.5,
        "stream": True
    }
    
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, stream=True)
    if not response.ok:
        payload["model"] = "gpt-4o-mini"
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, stream=True)
    response.raise_for_status()
    
    for line in response.iter_lines():
        if line:
            decoded = line.decode('utf-8')
            if decoded.startswith("data: "):
                data_str = decoded[6:]
                if data_str == "[DONE]":
                    break
                try:
                    chunk_data = json.loads(data_str)
                    delta = chunk_data["choices"][0]["delta"]
                    if "content" in delta:
                        yield delta["content"]
                except Exception:
                    pass

def call_gemini_chat_stream(
    prompt: str, 
    system_message: Optional[str] = None,
    chat_history: Optional[list[dict]] = None,
    custom_gemini_key: Optional[str] = None
):
    keys = get_all_gemini_keys(custom_gemini_key)
    sys_instruction = system_message or MASTER_TUTOR_SYSTEM_PROMPT

    contents = []
    if chat_history:
        for msg in chat_history[-6:]:
            role = "user" if msg.get("role") in ["Student", "user"] else "model"
            content = msg.get("text") or msg.get("content") or ""
            if content:
                contents.append({"role": role, "parts": [{"text": content}]})
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    config = genai.types.GenerateContentConfig(
        system_instruction=sys_instruction,
        temperature=0.5
    )

    if not keys:
        if client:
            response = client.models.generate_content_stream(
                model='gemini-2.5-flash',
                contents=contents,
                config=config
            )
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            return
        raise ValueError("No Gemini API keys are configured.")
        
    last_exception = None
    for key in keys:
        try:
            temp_client = genai.Client(api_key=key)
            response = temp_client.models.generate_content_stream(
                model='gemini-2.5-flash',
                contents=contents,
                config=config
            )
            # Try to fetch the first chunk to ensure connection/quota succeeds
            iterator = iter(response)
            try:
                first_chunk = next(iterator)
                if first_chunk.text:
                    yield first_chunk.text
            except StopIteration:
                return
                
            for chunk in iterator:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            err_msg = str(e)
            if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg or "quota" in err_msg.lower():
                logger.warning(f"Gemini streaming key rate limited or quota exceeded. Trying fallback key... Error: {e}")
                last_exception = e
                continue
            else:
                raise e
    if last_exception:
        raise last_exception

def stream_ai_response(
    prompt: str, 
    system_message: Optional[str] = None, 
    chat_history: Optional[list[dict]] = None,
    custom_gemini_key: Optional[str] = None, 
    custom_openai_key: Optional[str] = None
):
    provider = get_ai_provider(custom_gemini_key, custom_openai_key)
    if provider == "openai":
        yield from call_openai_chat_stream(prompt, system_message, chat_history, custom_openai_key)
    else:
        yield from call_gemini_chat_stream(prompt, system_message, chat_history, custom_gemini_key)
