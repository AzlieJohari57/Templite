# Resume Template Design Specifications

This document defines **four resume templates (A–D)** with clear **visual identity**, **Jinja2 paging logic**, and **CSS rules** to guarantee **pixel-perfect A4 (210mm × 297mm)** PDF output. The specs are optimized for use inside **Claude Code** and similar code-generation workflows.

---

## Template A — Modern Corporate

### 1. Visual & Layout Identity

**Header**

* Full-width **Navy** `#2C3E50`
* White square profile photo (left)
* Name & title in white text
* Decorative **Yellow** `#F1C40F` block (top-right)

**Columns (Asymmetric)**

* **Main (65%)**: About Me, Experience, Education
* **Sidebar (35%)**: Contact (circular icons), Skills, Personal Skills, Languages, References

**Dividers**

* Vertical dark divider between columns
* Section headers underlined with `1px` Navy stroke

---

### 2. Paging & Length Logic (Jinja2)

#### Page Count Calculation

```jinja2
{# Determine if the content requires 1 or 2 pages #}
{% if achievements or extra_activities %}
    {% set page_count = 2 %}
{% else %}
    {% set page_count = 1 %}
{% endif %}
```

#### Dynamic Content Density

* **Work Exp = 3** → 3 bullets per company
* **Work Exp = 2** → 4 bullets per company
* **Work Exp = 1** → 8 bullets per company
* **Work Exp = 0** → Hide Experience → generate **8 Core Strengths**

---

### 3. CSS PDF / Print Precision

```css
@page {
    size: A4;
    margin: 0;
}

.a4-wrapper {
    width: 210mm;
    height: 297mm;
    padding: 10mm;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
    background: white;
}

section {
    break-inside: avoid;
    page-break-inside: avoid;
}

.skill-bar-container {
    height: 6px;
    background: #eee;
    margin-bottom: 10px;
}

.skill-bar-fill {
    height: 100%;
    background: #F1C40F;
}
```

---

### 4. Page 2 Continuity Rules

If `page_count == 2`:

* Slim Navy header (−60% height, no photo)
* Vertical divider continues
* Main column starts with **Achievements** and **Extracurriculars**
* References positioned based on remaining space

---

### Claude Code Prompt Hook

> Act as a Jinja2 and CSS expert. Use the Design Specification: Template A document to build a resume generator. Ensure the HTML structure respects the 210mm x 297mm A4 limit exactly. Use the Work Experience counts provided to dynamically adjust the number of bullet points rendered so the page never looks empty. Fix the PDF conversion error where extra white space appears by ensuring no elements overflow the `.a4-wrapper` height.

---


## Image Reference Path

```
 @"context/image reference/template A.png"      
```

