# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Templite is an AI-powered resume generator with a React frontend and FastAPI backend. It uses LangChain + OpenAI GPT-4o-mini to intelligently enhance resume content, then renders to HTML templates and converts to PDF using Playwright.

## Template design

for the development of each template please follow as below

 1. @"templates English/template_A.html" refer to  @"context/template         visual/template A.md"    

 2. @"templates English/template_B.html" refer to  @"context/template         visual/template B.md"    

 3. @"templates English/template_C.html" refer to  @"context/template         visual/template C.md"   

 4. @"templates English/template_D.html" refer to  @"context/template         visual/template D.md"   

 5. @"templates English/template_E.html" refer to  @"context/template         visual/template E.md"   

 6. @"templates English/template_F.html" refer to  @"context/template         visual/template F.md"   

 7. @"templates English/template_J.html" refer to  @"context/template         visual/template J.md"   

 8. @"templates English/template_K.html" refer to  @"context/template         visual/template K.md"   

 9. @"templates English/template_L.html" refer to  @"context/template         visual/template L.md"   

### Backend (Python)

```bash
# Setup environment (first time only)
conda create -n templite python=3.12
conda activate templite
pip install -r requirements.txt

# Install Playwright browsers (required for PDF generation)
playwright install chromium

# Run the FastAPI server
python server.py
# Server runs at http://127.0.0.1:8000
```

### Frontend (React)

```bash
cd client

# Install dependencies
npm install

# Development server
npm run dev
# Runs at http://localhost:5173

# Build for production
npm run build

# Lint
npm run lint
```

### Running Full Stack

You need both servers running concurrently:
1. Backend: `python server.py` (terminal 1)
2. Frontend: `cd client && npm run dev` (terminal 2)

## Architecture

### Request Flow

1. **User Input** → React form (ResumeForm.tsx) collects resume data
2. **API Call** → Frontend sends JSON to `/create-resume` endpoint
3. **LLM Enhancement** → Backend processes through enhancement pipeline:
   - `enhance_about()` - Polishes professional summary
   - `enhance_experience()` - Optimizes job bullet points with metrics
   - `enhance_strength()` - Generates/refines professional strengths
   - `enhance_achievements()` - Enhances achievement descriptions
   - `enhance_resume_language()` - Final language-specific polish
4. **Rendering** → Jinja2 renders enhanced data to selected HTML template
5. **PDF Generation** → Playwright converts HTML to PDF via subprocess
6. **Response** → Returns paths to generated HTML and PDF files

### Content Adaptation Logic

The pipeline adapts content based on experience level (`create_resume.py:108`):

- **0 jobs**: 8 bullet points per job, max 45 words each; generates 8 strength bullets
- **1 job**: 8 bullet points, max 45 words each
- **2 jobs**: 4 bullet points per job, max 100 words each
- **3+ jobs**: 3 bullet points per job, max 45 words each

### Key Architecture Components

**Backend Pipeline (`create_resume.py`)**
- `create_resume_full_pipeline()` - Main orchestrator
- `enhance_resume()` - Applies all LLM enhancements
- `render_to_html()` - Jinja2 template rendering
- `convert_html_to_pdf()` - Subprocess-based PDF conversion using hardcoded Python path

**Template System**
- 12 templates (A-L) in both English and Bahasa Malaysia
- Selected via `TEMPLATE_MAP` dictionary
- Language determines template directory: `templates English/` or `templates Bahasa Malaysia/`
- All templates are Jinja2 HTML files

**API Layer (`server.py`)**
- Single endpoint: `POST /create-resume`
- CORS enabled for localhost:5173, localhost:3000
- Request: `{resume: dict, template: str, language: str}`
- Response: `{success: bool, message: str, pdf_path: str, html_path: str}`

**Frontend State Management**
- No global state library; uses React hooks
- Form data structure mirrors backend resume schema
- Optional fields toggled via `showOptionalFields` state
- AI generation feature via Google Generative AI (`services/gemini.ts`)

## Environment Configuration

Required environment variables in `.env`:

```
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here  # For Gemini AI features in frontend
```

## Critical Implementation Details

### PDF Generation Subprocess

The `convert_html_to_pdf()` function uses a hardcoded Python executable path (`create_resume.py:418`):

```python
python_exe = r"C:\Users\azlie\miniconda3\envs\templite\python.exe"
```

When working on a different machine, this path must be updated to match the local conda environment or switched to use `sys.executable`.

### LLM Prompt Engineering

All enhancement functions use structured prompts with specific rules. The prompts are designed to:
- Return JSON-only responses (no markdown wrappers)
- Enforce word limits and bullet counts
- Inject context (company, title, experience level)
- Maintain factual accuracy (no hallucination)

### JSON Response Parsing

`parse_llm_json_response()` handles various LLM output formats:
- Strips markdown code fences (```json, ```)
- Extracts JSON from text wrappers
- Handles both array and object responses

### Template Rendering Context

Templates receive the entire enhanced resume dictionary as context. All fields are optional and templates must handle missing data gracefully.

## File Structure Conventions

- `/templates English/` - English Jinja2 HTML templates (template_A.html through template_L.html)
- `/templates Bahasa Malaysia/` - Bahasa Malaysia templates
- `/generated html/` - Output HTML files (auto-created)
- `/generated resume/` - Output PDF files (auto-created)
- `/images/` - User profile images referenced in resumes
- `/old code/` - Legacy Jupyter notebooks (not used in production)

## Testing Approach

No automated test suite exists. Manual testing workflow:

1. Start both backend and frontend servers
2. Fill form with test data
3. Select template and language
4. Submit and verify both HTML and PDF generation
5. Check console logs for LLM enhancement process

Use the example data in `server.py:32-97` as a reference test payload.

## Template Design System

### Design Update Workflow

When updating template designs based on reference images:

1. **User provides**: Reference screenshot + template file path
2. **Claude analyzes**: Layout structure, color scheme, typography, spacing
3. **Claude updates**: HTML/CSS to match the design while maintaining Jinja2 template variables

### A4 Page Specifications

All templates must adhere to A4 dimensions:
- **Width**: 210mm
- **Height**: 297mm
- **Safe margins**: 10-16mm on all sides

### Content Density System

Templates use adaptive font sizing based on content amount:

```css
/* Dense content (5+ experience + education entries) */
.content-dense { /* smaller fonts, tighter spacing */ }

/* Normal content (3-4 entries) */
/* default styling */

/* Sparse content (0-2 entries) */
.content-sparse { /* larger fonts, more spacing to fill page */ }
```

### Page 2 Overflow Rules

Content moves to page 2 when:
- Experience entries > 4
- Education entries > 3
- Achievements section exists
- Extracurricular activities exist

### Template-Specific Layouts (Reference Designs)

Each template (A-L) has a unique layout. When updating a template, reference the design image provided:

| Template | Layout Description | Status |
|----------|-------------------|--------|
| A | Navy header + yellow accent, photo left, 2-column (Exp+Edu / Skills+Lang+Ref) | Updated |
| B | TBD - awaiting design reference | Pending |
| C | TBD - awaiting design reference | Pending |
| D | TBD - awaiting design reference | Pending |
| E | TBD - awaiting design reference | Pending |
| F | TBD - awaiting design reference | Pending |
| G | TBD - awaiting design reference | Pending |
| H | TBD - awaiting design reference | Pending |
| I | TBD - awaiting design reference | Pending |
| J | TBD - awaiting design reference | Pending |
| K | TBD - awaiting design reference | Pending |
| L | TBD - awaiting design reference | Pending |

### Template Update Command Format

To update a template design, provide:
```
Update template [X] based on this design: [screenshot path]
```

Claude will:
1. Read the screenshot to analyze the design
2. Read the current template file
3. Update CSS and HTML structure to match
4. Preserve all Jinja2 template variables
5. Ensure A4 fit and content density adaptation
6. Update this CLAUDE.md table with the layout description
