import os
import json
import re
from google import genai
from google.genai import types
from typing import Dict, Any, Tuple, Optional, List

from dotenv import load_dotenv

load_dotenv(override=True)

def get_llm_client():
    api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GROQ_API_KEY") or "").strip("'\" \t\r\n")
    if api_key and api_key not in ("your_gemini_api_key_here", "your_groq_api_key_here"):
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            print(f"[LLM Client Error] {e}")
            return None
    return None

import time

FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-pro"]

def _generate_content_with_fallback(prompt: str, system_prompt: str = None, temperature: float = 0.0, max_tokens: int = 4096, json_output: bool = False):
    client = get_llm_client()
    if client is None:
        raise ValueError("Gemini API key is not configured.")

    env_model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    models_to_try = [env_model] + [m for m in FALLBACK_MODELS if m != env_model]

    config = types.GenerateContentConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
    if system_prompt:
        config.system_instruction = system_prompt
    if json_output:
        config.response_mime_type = "application/json"

    last_err = None
    for model_name in models_to_try:
        try:
            return client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
        except Exception as e:
            last_err = e
            print(f"[LLM Chat] Model '{model_name}' hit error: {e}. Trying next fallback...")
            time.sleep(0.3)

    raise last_err

def _is_pathway_change_request(user_message: str) -> bool:
    """Detect whether the user asked to modify the roadmap/pathway."""
    return bool(
        re.search(
            r"\b(add|remove|delete|drop|replace|swap|modify|change|update|edit)\b.*\b(module|skill|pathway|roadmap)\b|\b(remove|delete|drop)\b.*\bpython\b",
            user_message,
            re.IGNORECASE,
        )
    )


def _extract_json_candidate(text: str) -> Optional[str]:
    """Extract JSON payload from a markdown code block; tolerate missing closing fence."""
    if not text:
        return None

    # Preferred: properly fenced JSON block.
    match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return match.group(1)

    # Fallback: opening json fence without closing fence (truncated output).
    start = re.search(r"```json\s*", text, re.IGNORECASE)
    if not start:
        return None

    tail = text[start.end() :]
    first_brace = tail.find("{")
    if first_brace == -1:
        return None

    return tail[first_brace:].strip()


def _build_module_reason(mod: Dict[str, Any]) -> str:
    reason = f"Module {mod['order']}: '{mod.get('skill_name', 'Unknown Skill')}' - "
    priority = str(mod.get("priority", "recommended"))

    if priority == "prerequisite":
        reason += "Added as a prerequisite dependency; must be completed before dependent skills."
    elif priority == "core":
        reason += "Core requirement for the target role; essential for day-one readiness."
    else:
        reason += "Recommended skill; strengthens the candidate's profile beyond the minimum."

    prereqs = mod.get("prerequisites_in_pathway", []) or []
    if prereqs:
        reason += f" Depends on: {', '.join(prereqs)}."

    return reason


def _normalize_pathway(updated_pathway: Dict[str, Any], fallback_pathway: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure pathway shape is valid and module ordering/totals are internally consistent."""
    normalized = dict(fallback_pathway)
    normalized.update(updated_pathway or {})

    modules = normalized.get("modules", [])
    if not isinstance(modules, list):
        modules = []

    cleaned_modules: List[Dict[str, Any]] = []
    for module in modules:
        if isinstance(module, dict):
            cleaned_modules.append(module)

    # Enforce stable sequential ordering.
    for idx, module in enumerate(cleaned_modules, start=1):
        module["order"] = idx

    completed_skill_ids = {
        str(module.get("skill_id", ""))
        for module in cleaned_modules
        if str(module.get("status", "")).lower() == "completed"
    }

    # Completed prerequisites should not block downstream modules.
    for module in cleaned_modules:
        prereqs = module.get("prerequisites_in_pathway", []) or []
        if isinstance(prereqs, list):
            module["prerequisites_in_pathway"] = [
                p for p in prereqs if p not in completed_skill_ids
            ]

    normalized["modules"] = cleaned_modules
    normalized["total_modules"] = len(cleaned_modules)

    total_hours = 0
    for module in cleaned_modules:
        hours = module.get("estimated_hours", 0)
        try:
            total_hours += int(float(hours))
        except (TypeError, ValueError):
            continue

    normalized["total_estimated_hours"] = total_hours
    normalized["estimated_weeks"] = round(total_hours / 20, 1) if total_hours else 0

    # Keep non-module reasoning steps, regenerate module_i entries to match ordering.
    original_trace = normalized.get("reasoning_trace", [])
    if not isinstance(original_trace, list):
        original_trace = []

    non_module_steps: List[Dict[str, Any]] = []
    for item in original_trace:
        if not isinstance(item, dict):
            continue
        step = str(item.get("step", ""))
        if not re.fullmatch(r"module_\d+", step):
            non_module_steps.append(item)

    regenerated_module_steps = [
        {"step": f"module_{mod['order']}", "message": _build_module_reason(mod)} for mod in cleaned_modules
    ]
    normalized["reasoning_trace"] = non_module_steps + regenerated_module_steps

    return normalized


def _regenerate_updated_pathway(user_message: str, current_pathway: Dict[str, Any], first_response: str) -> Optional[Dict[str, Any]]:
    """Ask model for strict JSON only if first response JSON is malformed/truncated."""
    repair_prompt = f"""
Return ONLY valid JSON (no markdown, no commentary) for the fully updated learning pathway.

Current pathway JSON:
{json.dumps(current_pathway, indent=2)}

User request:
{user_message}

Previous assistant response that may be truncated/invalid:
{first_response}

Requirements:
- Preserve original schema and all required fields.
- Recalculate total_modules, total_estimated_hours, estimated_weeks.
- Ensure module order values are sequential starting at 1.
- Ensure reasoning_trace entries with step module_i align to final module order.
- Output strictly valid JSON object only.
"""

    repair_completion = _generate_content_with_fallback(
        prompt=repair_prompt,
        temperature=0.0,
        max_tokens=4096,
        json_output=True,
    )

    repaired_text = repair_completion.text or ""
    json_candidate = _extract_json_candidate(repaired_text) or repaired_text.strip()
    return json.loads(json_candidate)

def process_chat(user_message: str, current_pathway: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    """
    Processes a chat message using Gemini. Returns (text_reply, updated_pathway_or_None).
    """
    system_prompt = f"""
You are the 'AdaptOnboard AI Mentor', an expert technical career coach.
The user is currently viewing their personalized Learning Pathway.
Here is their current pathway JSON:

{json.dumps(current_pathway, indent=2)}

YOUR GOAL:
1. Answer their question clearly, concisely, and encouragingly.
2. IF AND ONLY IF the user explicitly asks to ADD, REMOVE, or MODIFY a module in their roadmap, you MUST fulfill their request by outputting the ENTIRE updated pathway JSON in a strict markdown block at the very end of your response like this:
```json
{{
   ... full updated pathway ...
}}
```
If you are adding a module, ensure it has `skill_id`, `skill_name`, `category`, `priority` ("core" or "recommended"), `estimated_hours`, `resources` (list of objects with title, url, type, hours), `prerequisites_in_pathway`, `status`, and update the `total_modules` and `total_estimated_hours`.
If removing, filter it out and recalculate totals.

Do NOT output the raw JSON block unless the user explicitly requested a modification to the roadmap.
"""
    
    try:
        chat_completion = _generate_content_with_fallback(
            prompt=user_message,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=4096,
        )
        
        text = chat_completion.text or ""
        updated_pathway = None

        json_candidate = _extract_json_candidate(text)
        if json_candidate:
            try:
                parsed = json.loads(json_candidate)
                updated_pathway = _normalize_pathway(parsed, current_pathway)
                text = re.sub(r"```json\s*.*?\s*```", "", text, flags=re.DOTALL).strip()
            except json.JSONDecodeError:
                updated_pathway = None

        # Fallback: if user asked for a modification and JSON parsing failed, regenerate strict JSON.
        if updated_pathway is None and _is_pathway_change_request(user_message):
            try:
                repaired = _regenerate_updated_pathway(user_message, current_pathway, text)
                updated_pathway = _normalize_pathway(repaired, current_pathway)
            except Exception:
                updated_pathway = None
                
        return text, updated_pathway

    except Exception as e:
        return f"I'm sorry, I encountered an error: {str(e)}", None
