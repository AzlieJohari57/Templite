
# Design Specification: Template F (Geometric Lime & Charcoal)

## 1. Visual & Layout Identity

### Header — Geometric Two‑Tone Split

* **Top‑Left Decorative Block**
  Lime Green square `#A2C523` used as a geometric accent.

* **Profile Photo (Overlapping)**
  The profile photo overlaps both the Lime Green block and the Charcoal header area, creating a layered geometric effect.

* **Top‑Right Header Block**
  Solid Charcoal `#2D2D2D` background containing the **Candidate Name** in Lime Green text.

---

### Columns — Asymmetric Layout

* **Sidebar (Left – 35%)**
  Light Grey background `#DCDCDC`. Contains:

  * Contact information (circular Lime Green icons)
  * Skills
  * Personality
  * Languages
  * References

* **Main Column (Right – 65%)**
  Charcoal background `#2D2D2D`.

  * All body text in **White**
  * Section titles are excluded from white styling (see badges below)

---

### Section Badges

* Sections: **About Me**, **Experience**, **Education**
* Solid Lime Green `#A2C523` rectangular badges
* Centered **black text**
* Rounded corners for a modern geometric feel

---

### Accents

* Skill bars use **Lime Green fill** on a **Black** background

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

To prevent unwanted charcoal “voids” and ensure the A4 height is visually filled:

* **Work Experience = 3**
  Render **3 detail bullets** per company

* **Work Experience = 2**
  Render **4 detail bullets** per company

* **Work Experience = 1**
  Render **8 detail bullets** per company

* **Work Experience = 0**
  Hide the Experience section and generate **8 “Core Strengths”** displayed in a **2‑column grid** within the Charcoal main area

---

## 3. CSS “A4‑Perfect” Engine

```css
/* Container Fixes */
.resume-wrapper {
    width: 210mm;
    height: 297mm;
    display: flex;
    overflow: hidden; /* Fixes PDF white-space error */
    box-sizing: border-box;
}

.sidebar {
    width: 35%;
    height: 100%;
    background-color: #DCDCDC;
}

.main-content {
    width: 65%;
    background-color: #2D2D2D;
    color: #FFFFFF;
    padding: 25px;
}

/* Overlapping Profile Photo */
.profile-photo {
    border: 4px solid #FFFFFF;
    position: relative;
    top: -20px; /* Pulls photo into header space */
    z-index: 10;
}

/* Skill Bars */
.skill-bar-bg {
    background: #000000;
    height: 6px;
}

.skill-bar-fill {
    background: #A2C523;
    height: 100%;
}
```

---

## 4. Page 2 Continuity Rules

If `page_count == 2`:

* **Color Preservation**
  Maintain the Light Grey sidebar and Charcoal main column split on Page 2.

* **Header**
  Replicate the Lime Green name header in a **compact form**, omitting the overlapping profile photo.

* **Sectioning**
  Place **Achievements** and **Extra‑Curricular Activities** at the top of the Charcoal column using the same Lime Green badge style.

* **References**
  Anchor the Reference section to the **bottom of the Light Grey sidebar** on the final page.

---

## Claude Code Instruction

> Implement Template F using this specification. Emphasize the high‑contrast pairing of Lime Green (`#A2C523`) and Charcoal (`#2D2D2D`). Ensure the profile photo overlaps the header blocks correctly. Use the Jinja2 logic to expand experience bullet density when only one job exists so the Charcoal column remains visually balanced across the full A4 height.

---

## Image Reference Path

```
 @"context/image reference/template F.png"      

```

