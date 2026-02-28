
## Template B — Inverted Gold–Navy Sidebar

### 1. Visual & Layout Identity

**Header (Two-tier)**

* Top: White background, Name & Title in Navy `#1B263B`
* Bottom: Solid Navy bar connecting to sidebar

**Layout**

* Sidebar **Left (35%)**: Navy `#1B263B`
* Main **Right (65%)**: White

**Sidebar Color Blocks**

* Contact / Skills / Languages: White text on Navy
* About Me (Top): Gold `#D4A017` with Navy text
* References (Bottom): Gold `#D4A017` with Navy text

**Typography**

* Job titles: *Italic Dark Red / Maroon*

---

### 2. Paging & Length Logic (Jinja2)

```jinja2
{% if achievements or extra_activities %}
    {% set page_count = 2 %}
{% else %}
    {% set page_count = 1 %}
{% endif %}
```

**Dynamic Experience Sizing**

* 3 jobs → 3 bullets
* 2 jobs → 4 bullets
* 1 job → 8 bullets
* 0 jobs → 8 Core Strengths

---

### 3. CSS "A4-Perfect" Engine

```css
.resume-wrapper {
    width: 210mm;
    height: 297mm;
    margin: 0;
    overflow: hidden;
    display: flex;
}

@media print {
    body { margin: 0; }
    .resume-wrapper { page-break-after: always; }
}

.sidebar {
    width: 35%;
    height: 100%;
    background: #1B263B;
}

.main-content {
    width: 65%;
    padding: 20px;
}

.skill-bar-fill {
    background: #D4A017;
}
```

---

### 4. Page 2 Continuity Rules

* Sidebar Navy background persists
* Simplified header (no white tier)
* **Stacked Layout**: Achievements, Extracurriculars, and References are displayed in a stacked/vertical layout (NOT side-by-side) to prevent content compression
* References section at bottom of page 2 main content area

---

### Claude Code Instruction

> Generate a Jinja2 template based on `template_b.md`. Prioritize the height: 297mm and `overflow: hidden` properties to ensure the PDF conversion fits perfectly on a single A4 sheet without creating empty trailing pages.

---

## Image Reference Path

```
 @"context/image reference/template B.png"      
```

