import logging
from fastapi import APIRouter
from backend.schemas import TranslateRequest

logger = logging.getLogger("api.translation")
router = APIRouter()

@router.post("/api/translate")
async def post_translate(req: TranslateRequest):
    try:
        from backend.agents.base import BaseAgent
        agent = BaseAgent(
            role="Translation Specialist",
            system_prompt="You are a professional multilingual translator. Translate the given text into the target language. Respond ONLY with the translated text. Do not add any introduction, headers, quotes, or markdown formatting."
        )
        lang_names = {
            "es": "Spanish",
            "fr": "French",
            "hi": "Hindi"
        }
        target_name = lang_names.get(req.target_lang, "English")
        if target_name == "English":
            return {"translated_text": req.text}
        prompt = f"Translate the following text to {target_name}:\n{req.text}"
        translated = agent.call_gemini_text(prompt)
        return {"translated_text": translated}
    except Exception as error:
        logger.error("Error in translation endpoint: %s", error)
        return {"translated_text": req.text}
