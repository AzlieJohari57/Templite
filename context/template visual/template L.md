
# Template L — Professional Olive & Circle

## 1. Visual & Layout Identity

### Header

* Light grey / off‑white background.
* Candidate **Name** and **Job Title** are **right‑aligned** using a serif font.
* A **large circular profile photo** with a **double border (White + Olive)** is positioned on the **top‑left**, overlapping the header and the sidebar.

### Columns

* **2‑column asymmetric layout** with a full‑bleed colored sidebar.

#### Sidebar (Left — 30%)

* Solid **Olive‑Grey (#70785D)** background.
* Contains:

  * Contact
  * Education
  * Skills
  * Languages
* All text and icons are **White**.

#### Main Content (Right — 70%)

* White background.
* Sections:

  * Profile (About Me)
  * Work Experience
  * Reference

### Dividers & Accents

* Main‑column section headers are underlined using a **1px grey stroke**.
* Minimalist typography.
* **Work experience dates** are right‑aligned to the company name.

---

## 2. Paging & Length Logic (Jinja2)

### Page Count Calculation

```django
{# Determine if the content requires 1 or 2 pages #}
{% if achievements or extra_activities %}
    {% set page_count = 2 %}
{% else %}
    {% set page_count = 1 %}
{% endif %}
```

### Dynamic Content Density

To ensure the A4 height is visually filled:

* **Work Exp == 3** → 3 bullets per company
* **Work Exp == 2** → 4 bullets per company
* **Work Exp == 1** → 8 bullets per company
* **Work Exp == 0** → Hide Experience; generate **8 Core Strengths** bullets in the main column

---

## 3. CSS "A4‑Perfect" Engine

```css
/* Container Fixes */
.resume-wrapper {
    width: 210mm;
    height: 297mm;
    display: flex;
    overflow: hidden; /* Critical for A4 PDF fit */
    background: #ffffff;
}

.sidebar {
    width: 30%;
    background-color: #70785D; /* Olive-Grey */
    color: white;
    height: 100%;
    padding: 20px;
}

/* Circular Profile Image */
.profile-circle {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: 5px solid #70785D;
    overflow: hidden;
    position: absolute;
    top: 30px;
    left: 30px;
    z-index: 10;
}

.main-content {
    width: 70%;
    padding: 40px 30px;
    margin-top: 100px; /* Offset for header name space */
}

@media print {
    .resume-wrapper { page-break-after: always; }
}
```

---

## 4. Continuity Rules (Page 2)

If **page_count == 2**:

* **Sidebar Persistence**: Olive sidebar continues fully onto Page 2.
* **Simplified Header**: Repeat the Candidate Name at the top‑right in a smaller font; omit the circular photo.
* **Content Priority**: Achievements and Extra‑Curriculars begin at the top of the main column.
* **Reference Rule**: Reference section must be anchored at the **bottom of the main column** on the final page. If space allows, render it as a **2‑column grid**.

---

## Instructions for Claude Code

"Implement Template L using this .md spec. Pay close attention to the circular profile photo placement and the right‑aligned header text. Use the Jinja2 logic to ensure the Work Experience bullets are spaced correctly to fill the vertical A4 height, preventing extra blank pages by strictly enforcing the 297mm container height."

## Image Reference Path

```
 @"context/image reference/template L.png"      

```

