#!/usr/bin/env python3
"""
Create a page 2 PDF template with form fields for dynamic percentage values.
Removes Turnitin branding, header/footer, and replaces percentage text with fillable fields.
"""
import fitz  # PyMuPDF

INPUT_PDF = "scopelens-dashboard/public/templates/page2_template.pdf"
OUTPUT_PDF = "scopelens-dashboard/public/templates/page2_template_fields.pdf"

doc = fitz.open(INPUT_PDF)
page = doc[0]

# ── Step 1: Remove header and footer areas ──
# Header area (top ~45pt) and footer area (bottom ~45pt)
# We'll white-out these regions since we draw our own headers/footers
header_rect = fitz.Rect(0, 0, 612, 48)
footer_rect = fitz.Rect(0, 745, 612, 792)

page.draw_rect(header_rect, color=None, fill=(1, 1, 1))  # white
page.draw_rect(footer_rect, color=None, fill=(1, 1, 1))  # white

# ── Step 2: White-out the percentage text areas ──
# Main percentage: "0% detected as AI" at bbox (36.0, 81.0, 190.4, 102.3)
main_pct_rect = fitz.Rect(36, 79, 195, 104)
page.draw_rect(main_pct_rect, color=None, fill=(1, 1, 1))

# Group 1: "0" at bbox (52.0, 188.5, 56.0, 198.1) and "0%" within the text
# White out just the "0" count and the "0%" at the end
group1_count_rect = fitz.Rect(51, 187, 57, 199)
page.draw_rect(group1_count_rect, color=None, fill=(1, 1, 1))

# The "0%" in " AI-generated only 0%" - at end of text around x=120-133
group1_pct_rect = fitz.Rect(119, 187, 134, 199)
page.draw_rect(group1_pct_rect, color=None, fill=(1, 1, 1))

# Group 2: "0" at bbox (52.0, 216.5, 56.0, 226.1) and "0%" within the text
group2_count_rect = fitz.Rect(51, 215, 57, 227)
page.draw_rect(group2_count_rect, color=None, fill=(1, 1, 1))

# The "0%" in " AI-generated text that was AI-paraphrased 0%" - at end around x=200-215
group2_pct_rect = fitz.Rect(200, 215, 216, 227)
page.draw_rect(group2_pct_rect, color=None, fill=(1, 1, 1))

# ── Step 3: Replace "Turnitin" with "ScopeLens" in body text ──
# We need to white out and redraw the Turnitin mentions
turnitin_mentions = [
    # "about a student's work. We encourage you to learn more about Turnitin's AI detection"
    # Turnitin's starts around x=493
    (fitz.Rect(493, 108, 530, 119), "ScopeLens's"),
    # "How should I interpret Turnitin's AI writing percentage..."
    (fitz.Rect(147, 379, 188, 391), "ScopeLens's"),
    # "...qualifying text within the submission that Turnitin's AI writing"
    (fitz.Rect(367, 389, 407, 401), "ScopeLens's"),
]

for rect, replacement in turnitin_mentions:
    page.draw_rect(rect, color=None, fill=(1, 1, 1))
    page.insert_text(
        fitz.Point(rect.x0, rect.y1 - 2),
        replacement,
        fontsize=6 if rect.y0 < 200 else 7,
        fontname="helv",
        color=(0.12, 0.16, 0.23)
    )

# ── Step 4: Add form fields for dynamic values ──
# We'll use text widget annotations (form fields)

# Main percentage field: "X% detected as AI"
widget_main = fitz.Widget()
widget_main.field_name = "main_percent"
widget_main.field_type = fitz.PDF_WIDGET_TYPE_TEXT
widget_main.field_value = "0% detected as AI"
widget_main.rect = fitz.Rect(36, 79, 260, 104)
widget_main.text_fontsize = 17
widget_main.text_font = "Helvetica-Bold"
widget_main.text_color = (0.12, 0.16, 0.23)
widget_main.field_flags = fitz.PDF_FIELD_IS_READ_ONLY
page.add_widget(widget_main)

# Group 1 count field
widget_g1_count = fitz.Widget()
widget_g1_count.field_name = "group1_count"
widget_g1_count.field_type = fitz.PDF_WIDGET_TYPE_TEXT
widget_g1_count.field_value = "0"
widget_g1_count.rect = fitz.Rect(51, 187, 57, 199)
widget_g1_count.text_fontsize = 7
widget_g1_count.text_font = "Helvetica-Bold"
widget_g1_count.text_color = (0.12, 0.16, 0.23)
widget_g1_count.field_flags = fitz.PDF_FIELD_IS_READ_ONLY
page.add_widget(widget_g1_count)

# Group 1 percentage field
widget_g1_pct = fitz.Widget()
widget_g1_pct.field_name = "group1_percent"
widget_g1_pct.field_type = fitz.PDF_WIDGET_TYPE_TEXT
widget_g1_pct.field_value = "0%"
widget_g1_pct.rect = fitz.Rect(119, 187, 140, 199)
widget_g1_pct.text_fontsize = 7
widget_g1_pct.text_font = "Helvetica"
widget_g1_pct.text_color = (0.12, 0.16, 0.23)
widget_g1_pct.field_flags = fitz.PDF_FIELD_IS_READ_ONLY
page.add_widget(widget_g1_pct)

# Group 2 count field
widget_g2_count = fitz.Widget()
widget_g2_count.field_name = "group2_count"
widget_g2_count.field_type = fitz.PDF_WIDGET_TYPE_TEXT
widget_g2_count.field_value = "0"
widget_g2_count.rect = fitz.Rect(51, 215, 57, 227)
widget_g2_count.text_fontsize = 7
widget_g2_count.text_font = "Helvetica-Bold"
widget_g2_count.text_color = (0.12, 0.16, 0.23)
widget_g2_count.field_flags = fitz.PDF_FIELD_IS_READ_ONLY
page.add_widget(widget_g2_count)

# Group 2 percentage field
widget_g2_pct = fitz.Widget()
widget_g2_pct.field_name = "group2_percent"
widget_g2_pct.field_type = fitz.PDF_WIDGET_TYPE_TEXT
widget_g2_pct.field_value = "0%"
widget_g2_pct.rect = fitz.Rect(200, 215, 225, 227)
widget_g2_pct.text_fontsize = 7
widget_g2_pct.text_font = "Helvetica"
widget_g2_pct.text_color = (0.12, 0.16, 0.23)
widget_g2_pct.field_flags = fitz.PDF_FIELD_IS_READ_ONLY
page.add_widget(widget_g2_pct)

doc.save(OUTPUT_PDF)
doc.close()
print(f"Template saved to {OUTPUT_PDF}")
print("Form fields: main_percent, group1_count, group1_percent, group2_count, group2_percent")
