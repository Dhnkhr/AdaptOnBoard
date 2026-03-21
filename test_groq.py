import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

try:
    print("Testing fallback model llama-3.1-8b-instant...")
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        temperature=0,
        max_tokens=10,
        messages=[{"role": "user", "content": "Just say hi."}],
    )
    print("Fallback success:", completion.choices[0].message.content)
except Exception as e:
    print("Fallback failed:", type(e).__name__, str(e))
