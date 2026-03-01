# Design Specification: Template J (Red & Navy High-Contrast)

---

## 1. Visual & Layout Identity

### Header (Split-Block Design)

* **Main Header Block**: Large **Red (#C0392B)** rectangle containing **Name / Title** in **White**.
* **Side Block**: **Navy (#1B263B)** block framing the profile photo with a **white border**.
* The Navy block continues vertically into the sidebar for visual continuity.

### Column Structure

* **2-column asymmetric layout**

  * **Left Sidebar (35%)** – Solid Navy (#1B263B)
  * **Right Main Content (65%)** – White background

### Sidebar (Left – 35%)

* Background: **Navy (#1B263B)**
* Text Color: **White**
* Sections:

  * About Me
  * Skills
  * Personal Skills
  * References

### Main Content (Right – 65%)

* Background: **White**
* Sections:

  * Contact Info (top)
  * Experience
  * Education

### Vertical Accent Headers

* **EXPERIENCE** and **EDUCATION** headers:

  * Written vertically using `writing-mode: vertical-rl`
  * Rotated 180°
  * Placed in **Red (#C0392B)** rectangular blocks
  * Positioned to the left of their respective content blocks

### Skill Bars

* Background: **Black**
* Fill: **Red (#C0392B)**
* Located inside the Navy sidebar

---

## 2. Paging & Length Logic (Jinja2)

### Page Count Calculation

```jinja
{# Logic to determine 1 or 2 page output #}
{% if achievements or extra_activities %}
    {% set page_count = 2 %}
{% else %}
    {% set page_count = 1 %}
{% endif %}
```

### Dynamic Content Density Rules

To ensure the high-contrast layout fills the A4 height precisely:

* **Work Experience = 3 roles** → Render **3 bullets per role**
* **Work Experience = 2 roles** → Render **4 bullets per role**
* **Work Experience = 1 role** → Render **8 bullets**
* **Work Experience = 0 roles** →

  * Hide Experience section
  * Generate **8 Core Strengths** in the main column

---

## 3. CSS "A4-Perfect" Engine

```css
/* Container Fixes */
.resume-wrapper {
    width: 210mm;
    height: 297mm;
    display: flex;
    overflow: hidden; /* Critical for A4 fit */
    background: #ffffff;
}

.sidebar {
    width: 35%;
    background-color: #1B263B;
    color: white;
    height: 100%; /* Must span full A4 height */
}

/* Vertical Red Labels */
.vertical-header-red {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    background-color: #C0392B;
    color: white;
    padding: 15px 5px;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
}

.skill-bar-fill {
    background-color: #C0392B;
}
```

---

## 4. Continuity Rules (Page 2)

If `page_count == 2`:

### Sidebar Persistence

* Navy sidebar **must continue seamlessly** onto Page 2
* Any Red bottom border or accent must also persist

### Simplified Header (Page 2)

* Retain **slim Red name block**
* **Omit profile photo** to maximize usable vertical space

### Layout Symmetry

* **Achievements** and **Extra-Curriculars** must:

  * Use the same **Vertical Red Label** styling
  * Maintain alignment and spacing consistency with Experience/Education

### References

* Keep **References** at the **bottom of the Navy sidebar** on the final page

---

## Instructions for Claude Code

> Implement Template J using this `.md` spec. Focus on the bold **Navy (#1B263B)** and **Red (#C0392B)** color scheme. The most critical element is the `writing-mode: vertical-rl` implementation for the **Experience** and **Education** headers. Ensure the sidebar height is exactly **297mm** and apply the Jinja2 logic to dynamically scale work experience bullets so the white main column always feels full, balanced, and intentional.


## Image Reference Path

```
 @"context/image reference/template J.png"   

```

