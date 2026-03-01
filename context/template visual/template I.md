

# Design Specification: Template I (Modern Peach & Greyscale)

## 1. Visual & Layout Identity

### Header — Offset Geometric Style

* **Left Header Block**
  Vertical Peach rectangle `#D9BBA9` positioned behind the profile photo.

  * Profile photo is encased in a simple **grey border**.

* **Right Header Block**
  Large Peach block `#D9BBA9` containing the **Candidate Name** and **Title**.

  * Does **not** span the full page width, intentionally leaving white space on the far right.

---

### Columns — Symmetrical Layout

* Two-column layout divided by a **thin vertical line** for a clean, elegant look.

* **Left Column (Sidebar – 40%)**
  White background. Contains:

  * Contact (square icons)
  * Skill
  * Personal Skill
  * Language
  * Reference

* **Right Column (Main – 60%)**
  White background. Contains:

  * Experience
  * Education

---

### Accents

* Small Peach decorative square `#D9BBA9` positioned at the **bottom-right corner** of the page to visually balance the header.

---

### Skill Bars

* Horizontal bars
* Peach fill `#D9BBA9`
* White / Light Grey background track

---

## 2. Paging & Length Logic (Jinja2)

### Page Count Calculation

```jinja2
{# Determine if the content requires 1 or 2 pages #}
{% if achievements or extra_activities %}
    {% set page_count = 2 %}
{% else %}
    {% set page_count = 1 %}
{% endif %}
```

---

### Dynamic Content Density Rules

To maintain the clean, airy aesthetic while respecting the A4 height:

* **Work Experience = 3**
  Render **3 detail bullets** per company

* **Work Experience = 2**
  Render **4 detail bullets** per company

* **Work Experience = 1**
  Render **8 detail bullets** per company

* **Work Experience = 0**
  Hide the Experience section and generate **8 “Core Strengths”** in the main column

---

## 3. CSS “A4-Perfect” Engine

```css
/* Container Fixes */
.resume-wrapper {
    width: 210mm;
    height: 297mm;
    padding: 10mm;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Critical for A4 PDF fit */
    background: #ffffff;
    box-sizing: border-box;
}

/* Content Body */
.content-body {
    display: flex;
    flex-grow: 1;
    margin-top: 20px;
}

/* Central Divider */
.vertical-divider {
    width: 1px;
    background-color: #333;
    margin: 0 15px;
}

/* Header Name Block */
.name-block {
    background-color: #D9BBA9;
    padding: 20px;
    margin-left: 20px;
    flex-grow: 1;
}

/* Skill Bars */
.skill-bar-bg {
    height: 6px;
    background: #f2f2f2;
}

.skill-bar-fill {
    height: 100%;
    background: #D9BBA9;
}

@media print {
    .resume-wrapper { page-break-after: always; }
}
```

---

## 4. Page 2 Continuity Rules

If `page_count == 2`:

* **Header**
  Replicate the Peach name block in a **slimmed version**.

  * Omit the profile photo
  * Remove the vertical Peach bar

* **Symmetry**
  The central vertical divider line must continue through the entire second page.

* **Content Flow**
  Achievements and Extra‑Curricular Activities take priority at the **top of the main column**.

* **References**
  The Reference section remains anchored to the **bottom of the left column** on the final page.

---

## Claude Code Instruction

> Build Template I using this `.md` specification. Focus on the soft Peach (`#D9BBA9`) accents and the clean vertical divider. Ensure Contact icons and Skill bars align precisely within the sidebar. Use the Jinja2 logic to adjust bullet counts and line-height so the main column never appears empty when only a single experience role is provided.

---

## Image Reference Path

```
 @"context/image reference/template I.png"      

```

