#!/usr/bin/env python3
"""Deep line-by-line extraction of every element in the DOCX with exact formatting."""

from docx import Document
from docx.shared import Pt, Emu, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import json

DOCX_PATH = "/Users/manees/Mac_sync/ScopeLens/AI_Final Report.docx"
doc = Document(DOCX_PATH)

# Map alignment enums
align_map = {
    None: "left",
    WD_ALIGN_PARAGRAPH.LEFT: "left",
    WD_ALIGN_PARAGRAPH.CENTER: "center",
    WD_ALIGN_PARAGRAPH.RIGHT: "right",
    WD_ALIGN_PARAGRAPH.JUSTIFY: "justify",
}

print("=" * 80)
print("COMPLETE LINE-BY-LINE FORMATTING BREAKDOWN")
print("=" * 80)

# Track which section we're in (page)
section_idx = 0
sections = list(doc.sections)

for i, para in enumerate(doc.paragraphs):
    text = para.text.strip()
    if not text and not para.runs:
        continue
    
    style_name = para.style.name if para.style else "None"
    alignment = align_map.get(para.alignment, str(para.alignment))
    
    # Get paragraph-level spacing
    pf = para.paragraph_format
    space_before = f"{pf.space_before.pt:.1f}pt" if pf.space_before else "inherit"
    space_after = f"{pf.space_after.pt:.1f}pt" if pf.space_after else "inherit"
    line_spacing = str(pf.line_spacing) if pf.line_spacing else "inherit"
    
    # Get left indent
    left_indent = f"{pf.left_indent.inches:.2f}in" if pf.left_indent else "0"
    first_indent = f"{pf.first_line_indent.inches:.2f}in" if pf.first_line_indent else "0"
    
    print(f"\n{'─' * 80}")
    print(f"P{i:03d} | Style: {style_name} | Align: {alignment}")
    print(f"     | SpaceBefore: {space_before} | SpaceAfter: {space_after} | LineSpacing: {line_spacing}")
    print(f"     | LeftIndent: {left_indent} | FirstLineIndent: {first_indent}")
    
    if not text:
        print(f"     | [EMPTY PARAGRAPH]")
        continue
    
    # Print each run with its formatting
    for j, run in enumerate(para.runs):
        run_text = run.text
        if not run_text:
            continue
        
        font = run.font
        font_name = font.name or "(inherit from style)"
        font_size = f"{font.size.pt:.1f}pt" if font.size else "(inherit)"
        is_bold = "BOLD" if font.bold else "regular"
        is_italic = "ITALIC" if font.italic else ""
        is_underline = "UNDERLINE" if font.underline else ""
        
        color = "inherit"
        if font.color and font.color.rgb:
            color = f"#{font.color.rgb}"
        elif font.color and font.color.theme_color:
            color = f"theme:{font.color.theme_color}"
        
        # Show subscript/superscript
        extra = ""
        if font.subscript:
            extra += " SUBSCRIPT"
        if font.superscript:
            extra += " SUPERSCRIPT"
        
        # Truncate long text
        display_text = run_text[:80]
        if len(run_text) > 80:
            display_text += "..."
        
        flags = " ".join(filter(None, [is_bold, is_italic, is_underline, extra]))
        
        print(f"  R{j}: font={font_name} | size={font_size} | {flags} | color={color}")
        print(f"       \"{display_text}\"")

# Also check for inline images
print(f"\n{'=' * 80}")
print("INLINE IMAGES IN DOCUMENT")
print("=" * 80)

import zipfile
import xml.etree.ElementTree as ET

ns = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
}

with zipfile.ZipFile(DOCX_PATH, 'r') as z:
    doc_xml = z.read('word/document.xml').decode('utf-8')
    root = ET.fromstring(doc_xml)
    
    # Parse relationships to map rId to filenames
    rels_xml = z.read('word/_rels/document.xml.rels').decode('utf-8')
    rels_root = ET.fromstring(rels_xml)
    rns = {'r': 'http://schemas.openxmlformats.org/package/2006/relationships'}
    rId_map = {}
    for rel in rels_root.findall('r:Relationship', rns):
        rId_map[rel.get('Id')] = rel.get('Target')
    
    # Find all drawings (inline images)
    body = root.find('.//w:body', ns)
    paras = body.findall('.//w:p', ns)
    
    for pi, para in enumerate(paras):
        drawings = para.findall('.//w:drawing', ns)
        for di, drawing in enumerate(drawings):
            # Get image size
            inline = drawing.find('.//wp:inline', ns)
            if inline is None:
                inline = drawing.find('.//wp:anchor', ns)
            
            if inline is not None:
                extent = inline.find('wp:extent', ns)
                if extent is not None:
                    cx = int(extent.get('cx', 0))
                    cy = int(extent.get('cy', 0))
                    w_in = cx / 914400  # EMUs to inches
                    h_in = cy / 914400
                    w_pt = w_in * 72
                    h_pt = h_in * 72
                    
                    # Find the image reference
                    blip = inline.find('.//a:blip', ns)
                    if blip is not None:
                        embed = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed', '')
                        img_file = rId_map.get(embed, 'unknown')
                        print(f"  Para {pi}: Image {img_file} | {w_pt:.1f}pt × {h_pt:.1f}pt ({w_in:.2f}in × {h_in:.2f}in)")

# Page margins
print(f"\n{'=' * 80}")
print("PAGE MARGINS & DIMENSIONS")
print("=" * 80)
for i, section in enumerate(doc.sections):
    print(f"Section {i+1}:")
    print(f"  Page: {section.page_width.inches:.2f}in × {section.page_height.inches:.2f}in ({section.page_width.pt:.1f}pt × {section.page_height.pt:.1f}pt)")
    print(f"  Margins: top={section.top_margin.pt:.1f}pt  bottom={section.bottom_margin.pt:.1f}pt  left={section.left_margin.pt:.1f}pt  right={section.right_margin.pt:.1f}pt")
    
    # Header/footer distances
    if section.header_distance:
        print(f"  Header distance: {section.header_distance.pt:.1f}pt")
    if section.footer_distance:
        print(f"  Footer distance: {section.footer_distance.pt:.1f}pt")
