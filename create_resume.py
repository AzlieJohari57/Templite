"""
Resume Enhancement Pipeline
Processes resume JSON, optimizes wording using LLM, renders to HTML, and converts to PDF.
"""

import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

# ---------------------------
# Configuration
# ---------------------------

BASE_DIR = Path(__file__).parent
TEMPLATES_DIR_EN = BASE_DIR / "templates English"
TEMPLATES_DIR_BM = BASE_DIR / "templates Bahasa Malaysia"
GENERATED_HTML_DIR = BASE_DIR / "generated html"
GENERATED_PDF_DIR = BASE_DIR / "generated resume"

# Ensure output directories exist
GENERATED_HTML_DIR.mkdir(exist_ok=True)
GENERATED_PDF_DIR.mkdir(exist_ok=True)


# ---------------------------
# LLM Configuration
# ---------------------------

def get_llm() -> ChatOpenAI:
    """Initialize and return the LLM instance."""
    return ChatOpenAI(
        model="gpt-4o-mini",  # Cheapest GPT-4 class model
        temperature=0,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )


# ---------------------------
# Template Selection
# ---------------------------

TEMPLATE_MAP = {
    "A": "template_A.html",
    "B": "template_B.html",
    "C": "template_C.html",
    "D": "template_D.html",
    "E": "template_E.html",
    "F": "template_F.html",
    "G": "template_G.html",
    "H": "template_H.html",
    "I": "template_I.html",
    "J": "template_J.html",
    "K": "template_K.html",
    "L": "template_L.html",
    "M": "template_M.html",
}


def get_template_file(template_key: str) -> str:
    """Return template filename for given template key."""
    return TEMPLATE_MAP.get(template_key, "template_A.html")


def get_templates_dir(language: str) -> Path:
    """Return the templates directory based on language."""
    if language == "Bahasa Malaysia":
        return TEMPLATES_DIR_BM
    return TEMPLATES_DIR_EN


# ---------------------------
# JSON Parsing Helper
# ---------------------------

def parse_llm_json_response(raw: str) -> Any:
    """Sanitize and safely parse LLM output into JSON."""
    raw = raw.strip()

    # Remove markdown code fences
    if raw.startswith("```json"):
        raw = raw[7:].strip()
    elif raw.startswith("```"):
        raw = raw[3:].strip()
    if raw.endswith("```"):
        raw = raw[:-3].strip()

    # Extract JSON array/object if wrapped in text
    if not raw.startswith("[") and not raw.startswith("{"):
        json_start = raw.find("[") if "[" in raw else raw.find("{")
        json_end = raw.rfind("]") + 1 if "]" in raw else raw.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            raw = raw[json_start:json_end]

    return json.loads(raw)


# ---------------------------
# Experience Enhancer
# ---------------------------

def _determine_targets(n_jobs: int) -> tuple[int, int]:
    """Return (target_bullet_count, max_words) based on job count."""
    if n_jobs == 1:
        return 8, 45
    elif n_jobs == 2:
        return 4, 100
    else:
        return 3, 45


def enhance_experience(resume: dict, llm: ChatOpenAI) -> dict:
    """Enhance job experience bullet points with impactful, measurable language."""
    n_jobs = resume.get("number of jobs", 0)

    if n_jobs == 0 or not resume.get("experience"):
        return resume

    target, max_words = _determine_targets(n_jobs)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a professional resume writer. Return ONLY a JSON array of strings."),
        ("user", """Company: {company}
Title: {title}

Existing bullets:
{existing}

Produce exactly {target} bullet points.

RULES:
- If more than {target} exist, keep the strongest, then rewrite them.
- Each bullet must be clear, measurable, and professional.
- Use industry language, highlight impacts with metrics.
- Use context from the company and title.
- Each bullet ≤ {max_words} words.

Return ONLY a JSON array of strings. Example: ["Did X", "Improved Y", "Built Z"]""")
    ])

    chain = prompt | llm

    for exp in resume.get("experience", []):
        existing_md = "\n".join(f"- {b}" for b in exp.get("details", []))
        try:
            response = chain.invoke({
                "company": exp.get("company", ""),
                "title": exp.get("title", ""),
                "existing": existing_md or "No existing bullets",
                "target": target,
                "max_words": max_words
            })
            exp["details"] = parse_llm_json_response(response.content)
        except Exception as e:
            print(f"Warning: Failed to enhance experience '{exp.get('title')}': {e}")
            continue

    return resume


# ---------------------------
# Strength Enhancer
# ---------------------------

def enhance_strength(resume: dict, llm: ChatOpenAI) -> dict:
    """Generate or enhance professional strengths based on experience level."""
    n_jobs = resume.get("number of jobs", 0)
    title = resume.get("title", "Professional")
    existing_strengths = resume.get("strength", [])

    if n_jobs == 0:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a resume builder AI. Return ONLY a JSON array of strings."),
            ("user", """Candidate has no job experience but wants to apply for: {title}

Existing strengths (if any):
{existing}

Generate exactly 8 professional-strength bullet points (≤20 words each) highlighting:
- Relevant soft skills
- Academic achievements
- Transferable skills
- Eagerness to learn

Return ONLY a JSON array of 8 strengths.""")
        ])
    else:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a resume assistant. Return ONLY a JSON array of strings."),
            ("user", """Role: {title}

Existing strengths:
{existing}

Summarize the candidate's professional strengths in 1 comprehensive item (≤60 words).
Focus on measurable impacts and key competencies.

Return ONLY a JSON array with one string.""")
        ])

    chain = prompt | llm

    try:
        existing_md = "\n".join(f"- {s}" for s in existing_strengths) if existing_strengths else "None provided"
        response = chain.invoke({"title": title, "existing": existing_md})
        resume["strength"] = parse_llm_json_response(response.content)
    except Exception as e:
        print(f"Warning: Failed to enhance strengths: {e}")

    return resume


# ---------------------------
# About Section Enhancer
# ---------------------------

def enhance_about(resume: dict, llm: ChatOpenAI) -> dict:
    """Polish the 'about' section to be more professional and impactful."""
    title = resume.get("title", "Professional")
    current_about = resume.get("about", "")
    n_jobs = resume.get("number of jobs", 0)

    experience_level = "entry-level candidate" if n_jobs == 0 else f"professional with {n_jobs} role(s)"

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a professional resume writer. Return ONLY the enhanced text, no quotes or formatting."),
        ("user", """Role: {title}
Experience Level: {experience_level}

Current about section:
{current_about}

Rewrite this into a polished professional summary (2-3 sentences, ≤60 words):
- Start with experience level/years
- Highlight key expertise areas
- Mention career goals or value proposition
- Use confident, professional tone

Return ONLY the enhanced text.""")
    ])

    chain = prompt | llm

    try:
        response = chain.invoke({
            "title": title,
            "experience_level": experience_level,
            "current_about": current_about or "No description provided"
        })
        resume["about"] = response.content.strip().strip('"')
    except Exception as e:
        print(f"Warning: Failed to enhance about section: {e}")

    return resume


# ---------------------------
# Achievement Enhancer
# ---------------------------

def enhance_achievements(resume: dict, llm: ChatOpenAI) -> dict:
    """Enhance achievement descriptions with stronger action verbs and metrics."""
    achievements = resume.get("achievement", [])

    if not achievements:
        return resume

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a professional resume writer. Return ONLY a JSON array of strings."),
        ("user", """Role: {title}

Current achievements:
{achievements}

Enhance each achievement to be more impactful:
- Start with strong action verbs
- Include specific metrics and percentages where present
- Keep each achievement ≤50 words
- Maintain the original meaning and facts

Return ONLY a JSON array with the same number of enhanced achievements.""")
    ])

    chain = prompt | llm

    try:
        achievements_md = "\n".join(f"- {a}" for a in achievements)
        response = chain.invoke({
            "title": resume.get("title", "Professional"),
            "achievements": achievements_md
        })
        resume["achievement"] = parse_llm_json_response(response.content)
    except Exception as e:
        print(f"Warning: Failed to enhance achievements: {e}")

    return resume


# ---------------------------
# Language Post-Processing
# ---------------------------

LANGUAGE_INSTRUCTIONS = {
    "English": """You are a professional resume assistant.
Enhance and structure the resume JSON strictly in English.

RULES:
- Translate title to English if needed.
- Sort experiences from latest to earliest.
- Date format: DD/MM/YYYY.
- Ensure all text is grammatically correct.
- Leave missing info blank (no fake data).
- Preserve all existing fields and structure.""",

    "Bahasa Malaysia": """Anda ialah pembantu resume profesional.
Struktur & perkemas resume dalam Bahasa Malaysia.

PERATURAN:
- Susun pengalaman terkini ke terdahulu.
- Format tarikh: DD/MM/YYYY.
- Pastikan semua teks betul dari segi tatabahasa.
- Jika maklumat hilang, biarkan kosong.
- Kekalkan semua medan dan struktur sedia ada."""
}


def enhance_resume_language(resume: dict, llm: ChatOpenAI, language: str = "English") -> dict:
    """Apply final polishing & restructuring in selected language."""
    instructions = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["English"])

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a resume formatting assistant. Return ONLY valid JSON."),
        ("user", """{instructions}

Resume JSON:
{resume_json}

Return the enhanced resume as a valid JSON object.""")
    ])

    chain = prompt | llm

    try:
        response = chain.invoke({
            "instructions": instructions,
            "resume_json": json.dumps(resume, indent=2)
        })
        return parse_llm_json_response(response.content)
    except Exception as e:
        print(f"Warning: Failed language enhancement: {e}")
        return resume


# ---------------------------
# HTML Rendering
# ---------------------------

def render_to_html(resume: dict, template_key: str, language: str = "English") -> str:
    """
    Render enhanced resume data into HTML using Jinja2 template.

    Args:
        resume: Enhanced resume dictionary
        template_key: Template identifier (A-J)
        language: Language for template selection

    Returns:
        Rendered HTML string
    """
    templates_dir = get_templates_dir(language)
    template_file = get_template_file(template_key)

    env = Environment(loader=FileSystemLoader(str(templates_dir)))
    template = env.get_template(template_file)

    return template.render(**resume)


def save_html(html_content: str, output_path: str | Path) -> Path:
    """Save HTML content to file."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    return output_path


# ---------------------------
# PDF Conversion
# ---------------------------

def convert_html_to_pdf(html_path: str | Path, pdf_path: str | Path) -> Path:
    """
    Convert HTML file to PDF using Playwright directly.

    Args:
        html_path: Path to HTML file
        pdf_path: Path for output PDF

    Returns:
        Path to generated PDF
    """
    from playwright.sync_api import sync_playwright

    html_path = Path(html_path)
    pdf_path = Path(pdf_path)
    pdf_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            file_uri = html_path.as_uri()
            page.goto(file_uri)
            page.wait_for_load_state('networkidle')
            page.emulate_media(media="print")

            page.pdf(
                path=str(pdf_path),
                format="A4",
                print_background=True,
                margin={"top": "0.5mm", "bottom": "0.5mm", "left": "0.5mm", "right": "0.5mm"},
            )

            browser.close()

        print(f"  PDF saved to: {pdf_path}")
    except Exception as e:
        print(f"PDF conversion error: {e}")
        raise RuntimeError(f"PDF conversion failed: {e}")

    return pdf_path


# ---------------------------
# Pipeline Orchestration
# ---------------------------

def enhance_resume(resume: dict, language: str = "English") -> dict:
    """
    Enhance all resume sections using LLM.

    Args:
        resume: Dictionary containing resume data
        language: Target language ("English" or "Bahasa Malaysia")

    Returns:
        Enhanced resume dictionary
    """
    llm = get_llm()

    # Apply all enhancements
    resume = enhance_about(resume, llm)
    resume = enhance_experience(resume, llm)
    resume = enhance_strength(resume, llm)
    resume = enhance_achievements(resume, llm)
    resume = enhance_resume_language(resume, llm, language)

    return resume


def process_resume_json(json_input: str | dict, language: str = "English", output_file: str | None = None) -> dict:
    """
    Process a resume: enhance wording with LLM.

    Args:
        json_input: Resume data as JSON string or dictionary
        language: Target language for output
        output_file: Optional file path to save enhanced JSON

    Returns:
        Enhanced resume dictionary
    """
    # Parse input if string
    if isinstance(json_input, str):
        resume = json.loads(json_input)
    else:
        resume = json_input.copy()

    # Enhance the resume
    enhanced = enhance_resume(resume, language)

    # Save to file if requested
    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(enhanced, f, indent=2, ensure_ascii=False)
        print(f"Enhanced resume saved to: {output_file}")

    return enhanced


def create_resume_full_pipeline(
    resume_data: dict,
    template_key: str = "A",
    language: str = "English",
) -> dict:
    """
    Full pipeline: JSON → LLM Enhancement → HTML → PDF

    Args:
        resume_data: Raw resume dictionary
        template_key: Template identifier (A-J)
        language: Target language ("English" or "Bahasa Malaysia")

    Returns:
        Dictionary with paths and enhanced data:
        {
            "enhanced_data": dict,
            "html_path": str,
            "pdf_path": str
        }
    """
    # Generate filename from candidate name (sanitized)
    candidate_name = resume_data.get("name", "resume").replace(" ", "_")

    # Step 1: Enhance resume with LLM
    print("Step 1/3: Enhancing resume with LLM...")
    enhanced_resume = enhance_resume(resume_data.copy(), language)

    # Step 2: Render to HTML
    print("Step 2/3: Rendering to HTML...")
    html_content = render_to_html(enhanced_resume, template_key, language)
    html_file_path = GENERATED_HTML_DIR / f"{candidate_name}_resume.html"
    save_html(html_content, html_file_path)
    print(f"  HTML saved to: {html_file_path}")

    # Step 3: Convert to PDF
    print("Step 3/3: Converting to PDF...")
    pdf_file_path = GENERATED_PDF_DIR / f"{candidate_name}_resume.pdf"
    convert_html_to_pdf(html_file_path, pdf_file_path)

    return {
        "enhanced_data": enhanced_resume,
        "html_path": str(html_file_path),
        "pdf_path": str(pdf_file_path)
    }
