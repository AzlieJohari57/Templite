
# Design Specification: Template E (Asymmetric Blue Block)

## 1. Visual & Layout Identity

### Header — Dynamic 3-Block Design

* **Top-Left Block**
  Large Navy square `#1B263B` that visually spans into the sidebar area.

* **Center Header Block**
  Sky Blue rectangle `#5D9CEC` containing the **Candidate Name** in bold Navy text.

* **Right Header Block**
  White block featuring the profile photo framed with a Navy border.

---

### Columns — Asymmetric Layout

* **Main Column (Left – 60%)**
  White background. Contains:

  * About Me
  * Experience
  * Education
    Section titles are rendered inside **Sky Blue horizontal badges**.

* **Sidebar (Right – 40%)**
  Navy background `#1B263B`. Contains:

  * Contact information (Sky Blue circular icons)
  * Skills
  * Personal Skills
  * Languages
  * References

---

### Footer

* Solid **Sky Blue** horizontal bar positioned at the very bottom of the page.

---

### Skill Bars

* Sky Blue fill `#5D9CEC`
* White / Light Grey background track
* Rendered inside the Navy sidebar

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

To maintain visual balance and avoid empty space:

* **Work Experience = 3**
  Render **3 detail bullets** per company

* **Work Experience = 2**
  Render **4 detail bullets** per company

* **Work Experience = 1**
  Render **8 detail bullets** per company

* **Work Experience = 0**
  Hide the Experience section and generate **8 “Core Strengths”** items, each displayed inside a Sky Blue badge in the main column

---

## 3. CSS “A4-Perfect” Engine

```css
/* Container Fixes */
.resume-wrapper {
    width: 210mm;
    height: 297mm;
    display: flex;
    flex-direction: row;
    overflow: hidden; /* Critical to prevent extra A4 pages */
    background: #ffffff;
}

.sidebar {
    width: 40%;
    height: 100%;
    background-color: #1B263B;
    color: #ffffff;
}

.main-content {
    width: 60%;
    padding: 30px;
}

/* Section Badge Style */
.section-badge {
    background-color: #5D9CEC;
    color: #1B263B;
    padding: 5px 15px;
    font-weight: bold;
    display: inline-block;
    margin-bottom: 15px;
}

/* Skill Bars */
.skill-bar-bg {
    height: 6px;
    background: #f2f2f2;
}

.skill-bar-fill {
    height: 100%;
    background: #5D9CEC;
}

@media print {
    .resume-wrapper { page-break-after: always; }
}
```

---

## 4. Page 2 Continuity Rules

If `page_count == 2`:

* **Sidebar Persistence**
  The Navy sidebar and the Sky Blue footer bar must continue onto Page 2.

* **Simplified Header**
  Render only the Sky Blue name block (shortened height). Remove the large Navy square and profile photo.

* **Content Flow**
  Place **Achievements** and **Extra-Curricular Activities** at the top of the main column using the same Sky Blue badge styling.

* **References**
  Always anchor the Reference section to the **bottom of the Navy sidebar** on the final page.

---

## Claude Code Instruction

> Implement Template E using this `.md` specification. Respect the fixed A4 size (210mm × 297mm) and ensure `overflow: hidden` is enforced on the root container to avoid extra PDF pages. Use the Work Experience count to dynamically adjust bullet density. When no work experience exists, replace the section with eight Sky Blue “Core Strengths” badges to preserve visual balance.

---
## Image Reference Path

```
 @"context/image reference/template E.png"      

```

