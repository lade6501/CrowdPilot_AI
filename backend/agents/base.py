import json
import logging
from typing import Type, TypeVar, Dict, Any
from pydantic import BaseModel
import google.generativeai as genai
from backend.config import config

logger = logging.getLogger("agents.base")
T = TypeVar("T", bound=BaseModel)


_initialized = False

def initialize_gemini():
    global _initialized
    if not _initialized:
        config.validate()
        genai.configure(api_key=config.GEMINI_API_KEY)
        _initialized = True
        logger.info("Google Generative AI successfully configured.")


ai_ops_calls = 0

def increment_ai_calls():
    global ai_ops_calls
    ai_ops_calls += 1
    try:
        from backend.simulator import stadium_state
        stadium_state["ai_ops_calls"] = ai_ops_calls
    except ImportError:
        pass

class BaseAgent:
    def __init__(self, role: str, system_prompt: str):
        self.role = role
        self.system_prompt = system_prompt
        self.model_name = "gemini-2.5-flash"

    def call_gemini_structured(self, user_content: str, response_schema: Type[T]) -> T:
        initialize_gemini()
        increment_ai_calls()
        
        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=self.system_prompt
            )
            

            response = model.generate_content(
                user_content,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=0.2
                )
            )
            

            raw_text = response.text.strip()
            logger.info(f"[{self.role}] Raw LLM response: {raw_text}")
            return response_schema.model_validate_json(raw_text)
            
        except Exception as e:
            logger.error(f"Error calling Gemini in agent {self.role}: {e}", exc_info=True)
            raise e

    def call_gemini_text(self, user_content: str) -> str:
        initialize_gemini()
        increment_ai_calls()
        
        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=self.system_prompt
            )
            response = model.generate_content(
                user_content,
                generation_config=genai.GenerationConfig(
                    temperature=0.3
                )
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error calling Gemini in agent {self.role}: {e}", exc_info=True)
            raise e