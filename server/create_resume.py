"""
Resume Enhancement Pipeline
Processes resume JSON, optimizes wording using LLM, renders to HTML, and converts to PDF.
"""

import json
import os
import tempfile
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader, select_autoescape
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from gdrive import upload_pdf_to_drive
import oss_storage

load_dotenv(Path(__file__).parent.parent / ".env")

# ---------------------------
# Configuration
# ---------------------------

BASE_DIR = Path(__file__).parent
TEMPLATES_DIR_EN = BASE_DIR / "templates" / "english"
TEMPLATES_DIR_BM = BASE_DIR / "templates" / "bahasa_malaysia"

# Ephemeral scratch dir. On Function Compute only /tmp is writable and it is
# wiped per instance — that is fine, the PDF is uploaded to OSS + Google Drive
# within the same request before the file is needed again.
GENERATED_PDF_DIR = Path(tempfile.gettempdir()) / "generated_resume"
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
Struktur & perkemas resume dalam Bahasa Malaysia yang betul dan natural.

PERATURAN:
- Gunakan Bahasa Malaysia formal dan natural — elakkan terjemahan harfiah.
- Guna "Kelebihan" (bukan "Kekuatan") untuk bahagian strengths.
- Guna "Pengalaman Kerja" (bukan "Pengalaman Bekerja").
- Guna "Pencapaian" (bukan "Kejayaan") untuk achievements.
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

    env = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        autoescape=select_autoescape(["html"]),
    )
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
            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                    "--no-zygote",
                    "--disable-gpu",
                    "--disable-extensions",
                    "--disable-default-apps",
                ],
            )
            try:
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
            finally:
                context.close()
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
    The four independent sections run in parallel threads; the language
    polishing pass runs last because it depends on all four outputs.
    """
    from concurrent.futures import ThreadPoolExecutor

    # Each thread needs its own ChatOpenAI instance — the underlying
    # openai sync client is not safe to share across threads.
    def _about():       enhance_about(resume, get_llm())
    def _experience():  enhance_experience(resume, get_llm())
    def _strength():    enhance_strength(resume, get_llm())
    def _achievements():enhance_achievements(resume, get_llm())

    with ThreadPoolExecutor(max_workers=4) as executor:
        named_futures = [
            ("about",        executor.submit(_about)),
            ("experience",   executor.submit(_experience)),
            ("strength",     executor.submit(_strength)),
            ("achievements", executor.submit(_achievements)),
        ]
        for name, f in named_futures:
            try:
                f.result()
            except Exception as e:
                print(f"Warning: {name} enhancement failed (continuing): {e}")

    return enhance_resume_language(resume, get_llm(), language)


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


def pipeline_phase1_llm(
    resume_data: dict,
    template_key: str = "A",
    language: str = "English",
) -> tuple[dict, str, str]:
    """
    Phase 1 (no semaphore needed): LLM enhancement + HTML render.
    Safe to run for all users simultaneously — uses only network I/O, no Chromium.

    Returns:
        (enhanced_resume, html_content, file_id)
    """
    phone = resume_data.get("telephone", "").replace(" ", "").replace("-", "").replace("+", "")
    file_id = phone if phone else resume_data.get("name", "resume").replace(" ", "_")

    print("Phase 1/2: Enhancing resume with LLM...")
    enhanced_resume = enhance_resume(resume_data.copy(), language)

    print("Phase 1/2: Rendering to HTML...")
    html_content = render_to_html(enhanced_resume, template_key, language)

    return enhanced_resume, html_content, file_id


def pipeline_phase2_pdf(
    html_content: str,
    file_id: str,
) -> dict:
    """
    Phase 2 (semaphore-guarded): Playwright PDF generation + uploads.
    Chromium uses ~350 MB per instance — this is the only part that needs the semaphore.

    The PDF is written to ephemeral /tmp, then uploaded to OSS (delivery via a
    signed URL) and Google Drive. Nothing is kept on local disk.

    Returns:
        {"pdf_path": str, "pdf_url": str | None, "drive_url": str | None}
    """
    pdf_file_path = GENERATED_PDF_DIR / f"{file_id}_resume.pdf"

    print("Phase 2/2: Converting to PDF...")
    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write(html_content)
        tmp_html_path = Path(tmp.name)

    try:
        convert_html_to_pdf(tmp_html_path, pdf_file_path)

        # Upload to OSS and produce a time-limited download URL for the browser.
        pdf_url = None
        if oss_storage.is_configured():
            try:
                key = oss_storage.put_pdf(file_id, pdf_file_path)
                pdf_url = oss_storage.signed_url(key)
                print(f"  [OSS] PDF uploaded: {key}")
            except Exception as e:
                print(f"  [OSS] PDF upload failed: {e}")

        print("Phase 2/2: Uploading PDF to Google Drive...")
        drive_url = None
        try:
            drive_url = upload_pdf_to_drive(pdf_file_path)
            if drive_url:
                print(f"  Uploaded: {drive_url}")
            else:
                print("  [GDrive] Upload skipped — not authorized or upload returned no URL.")
        except Exception as e:
            print(f"  [GDrive] Upload failed: {e}")
    finally:
        tmp_html_path.unlink(missing_ok=True)
        # Free ephemeral disk immediately once uploads are done.
        pdf_file_path.unlink(missing_ok=True)

    return {"pdf_path": str(pdf_file_path), "pdf_url": pdf_url, "drive_url": drive_url}
