
# Design Specification: Template K (Clean Academic Functional)

---

## 1. Visual & Layout Identity

### Header

* Minimalist **white background**
* **Candidate Name**: left-aligned, large, bold, black sans-serif
* **Contact details** (Address · Email · Phone): arranged horizontally in one line or compact block directly below the name

### Profile Photo

* **Square aspect ratio**
* Positioned at the **top-right corner**
* Thin **1px black border**

### Columns & Structure

* **2-column balanced layout** with a strong central vertical divider

**Left Column (45%)**

* Educational Background
* Technical & Personality Proficiency
* Languages / Strengths
* References

**Right Column (55%)**

* Objective Summary (top)
* Professional Experience

### Typography & Styling

* Clean, professional, academic tone
* Generous spacing, readable hierarchy
* Experience bullets use **solid square bullets / checkbox-style squares**
* Section headers are **bold** and paired with a **full-width 1px black horizontal rule** (above or below)

---

## 2. Paging & Length Logic (Jinja2)

### Page Count Calculation

```jinja
{# Determine if the content requires 1 or 2 pages #}
{% if achievements or extra_activities %}
    {% set page_count = 2 %}
{% else %}
    {% set page_count = 1 %}
{% endif %}
```

### Dynamic Content Density Rules

To preserve a full, academic A4 layout:

* **Work Exp == 3** → Render **3 bullets per company**
* **Work Exp == 2** → Render **4 bullets per company**
* **Work Exp == 1** → Render **8 bullets per company** (critical to fill right column)
* **Work Exp == 0** → Hide Experience section

  * Generate **8 detailed Core Strengths** to fully occupy the right column

---

## 3. CSS "A4-Perfect" Engine

```css
/* Container Fixes */
.resume-wrapper {
    width: 210mm;
    height: 297mm;
    padding: 12mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #ffffff;
    box-sizing: border-box;
    font-size: 10pt; /* Academic standard */
}

/* Two-Column Grid with Divider */
.grid-body {
    display: grid;
    grid-template-columns: 0.9fr 1px 1.1fr;
    gap: 25px;
    flex-grow: 1;
}

.center-divider {
    background-color: #000000;
    width: 1px;
    height: 100%;
}

/* Experience Bullet Styling */
.experience-list ul {
    list-style-type: square;
    padding-left: 15px;
}

@media print {
    .resume-wrapper { page-break-after: always; }
}
```

---

## 4. Continuity Rules (Page 2)

When `page_count == 2`:

### Header Continuity

* Repeat **Candidate Name** at the top-left in a **smaller font size**
* **Omit profile photo** to maximize content space

### Structural Consistency

* Central vertical divider must continue **unbroken to the bottom of Page 2**

### Content Distribution

* **Left Column**: Achievements
* **Right Column**: Extra-Curricular Activities

### References

* References must remain **anchored to the very bottom of the Left Column** on the final page

---

## Instructions for Claude Code

> "Build Template K using this spec. This is a text-heavy, academic resume, so prioritize readability with `line-height: 1.4` and consistent `margin-bottom`. Ensure the central vertical divider spans exactly from the bottom of the header to the bottom of the A4 page. Use Jinja2 logic so that when only one Professional Experience is present, the bullet list expands vertically to align with the References section at the bottom-left."

## Image Reference Path

```
 @"context/image reference/template K.png"  

```

