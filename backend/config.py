import os
from dotenv import load_dotenv


backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    PORT = int(os.getenv("PORT", 8000))
    HOST = os.getenv("HOST", "0.0.0.0")

    @classmethod
    def validate(cls):
        if not cls.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable "
                "or define it in a .env file in the backend directory."
            )

config = Config()