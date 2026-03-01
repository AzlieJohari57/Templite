
## Template C — Black & Gold Geometric

### 1. Visual & Layout Identity

**Header (Split)**

* Top-left: Light Grey `#D3D3D3` (photo + contact)
* Top-right: Black `#000` with Gold name/title `#D4AF37`

**Columns**

* 50 / 50 split
* Left: Light Grey (content)
* Right: Black (skills, refs, languages)

**Vertical Accents**

* Gold vertical labels using rotated text (`EXPERIENCE`, `EDUCATION`)

---

### 2. Paging & Length Logic

```jinja2
{% if achievements or extra_activities %}
    {% set page_count = 2 %}
{% else %}
    {% set page_count = 1 %}
{% endif %}
```

**Dynamic Density Rules** identical to Templates A & B.

---

### 3. CSS "A4-Perfect" Engine

```css
.resume-wrapper {
    width: 210mm;
    height: 297mm;
    display: flex;
    overflow: hidden;
}

.vertical-label {
    writing-mode: vertical-rl;
    text-orientation: upright;
    background: #D4AF37;
    color: #000;
    font-weight: bold;
    padding: 10px 5px;
}

.bar-bg {
    height: 6px;
    background: #444;
}

.bar-fill {
    height: 100%;
    background: #D4AF37;
}
```

---

### 4. Page 2 Continuity Rules

* Maintain 50/50 split
* Slim Black header repeated
* Gold vertical labels for new sections
* Overflow skills continue in right column only

---

## Image Reference Path

```
 @"context/image reference/template C.png"      

```

