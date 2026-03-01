
## Template D — Clean Minimalist

### 1. Visual & Layout Identity

**Header**

* White background
* Name & Title left-aligned (dark grey / black)
* Thick horizontal bar under name
* Profile photo on far right (grey frame)

**Layout**

* Symmetrical 2-column
* Vertical center divider

**Left (40%)**

* Contact, Skills, Personality Skills, Languages, References

**Right (60%)**

* About Me, Experience, Education

---

### 2. Paging & Length Logic

```jinja2
{% if achievements or extra_activities %}
    {% set page_count = 2 %}
{% else %}
    {% set page_count = 1 %}
{% endif %}
```

**Dynamic Density**

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
    padding: 15mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
}

.content-grid {
    display: grid;
    grid-template-columns: 4fr 1px 6fr;
    gap: 20px;
    flex-grow: 1;
}

.vertical-line {
    width: 1px;
    background: #333;
}

.bar-container {
    height: 8px;
    border: 1px solid #333;
}

.bar-fill {
    height: 100%;
    background: #333;
}
```

---

### 4. Page 2 Continuity Rules

* Header repeated (no photo)
* Vertical divider spans full height
* Education may move up
* References locked to bottom-left

---

## Image Reference Path

```
 @"context/image reference/template D.png"      

```

