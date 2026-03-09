"""
Generate a HIGH-RISK synthetic death certificate PDF for the ClaimPath demo.
Subject: John Michael Smith (policy LT-29471)

Same insured as the low-risk cert, but death is from a rock climbing fall
(accidental) — triggers hazardous activity mismatch with application Q12.

Usage:  python scripts/generate-death-cert-high-risk.py
Output: frontend/public/demo/death-certificate-smith-high-risk.pdf
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "demo")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "death-certificate-smith-high-risk.pdf")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Colors ─────────────────────────────────────────────────────────────────────
DARK = HexColor("#1a1a1a")
MID = HexColor("#444444")
LIGHT = HexColor("#888888")
BORDER = HexColor("#333333")
FIELD_BG = HexColor("#f7f7f7")
HEADER_BG = HexColor("#1a2744")
HEADER_TEXT = HexColor("#ffffff")
ACCENT = HexColor("#1a2744")
RULE_COLOR = HexColor("#cccccc")

# ── Page setup ─────────────────────────────────────────────────────────────────
WIDTH, HEIGHT = letter  # 8.5 x 11
MARGIN = 0.5 * inch
INNER_W = WIDTH - 2 * MARGIN

# ── Spacing constants ──────────────────────────────────────────────────────────
FIELD_H = 28           # field box height
ROW_GAP = 32           # vertical advance per row of fields
SECT_BEFORE = 34       # gap before a section header
BAR_H = 14             # section header bar height
POST_BAR = 22          # gap from bottom of bar to first row


def draw_field(c, x, y, label, value, width, height=FIELD_H):
    """Draw a labeled form field with background."""
    c.setFillColor(FIELD_BG)
    c.roundRect(x, y, width, height, 2, fill=1, stroke=0)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 6)
    c.drawString(x + 4, y + height - 9, label.upper())
    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    c.drawString(x + 4, y + 4, value)


def draw_section_header(c, x, y, title, width):
    """Draw a section header bar at the given y (bottom of bar). Returns bottom y."""
    c.setFillColor(ACCENT)
    c.roundRect(x, y, width, BAR_H, 2, fill=1, stroke=0)
    c.setFillColor(HEADER_TEXT)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(x + 6, y + 3.5, title.upper())
    return y


def draw_horizontal_rule(c, x, y, width):
    c.setStrokeColor(RULE_COLOR)
    c.setLineWidth(0.5)
    c.line(x, y, x + width, y)


def generate():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=letter)
    c.setTitle("Certificate of Death - John Michael Smith")
    c.setAuthor("Illinois Department of Public Health")

    y = HEIGHT - MARGIN

    # ── Outer border ───────────────────────────────────────────────────────────
    c.setStrokeColor(BORDER)
    c.setLineWidth(2)
    c.rect(MARGIN - 8, MARGIN - 8, INNER_W + 16, HEIGHT - 2 * MARGIN + 16)
    c.setLineWidth(0.75)
    c.rect(MARGIN - 4, MARGIN - 4, INNER_W + 8, HEIGHT - 2 * MARGIN + 8)

    # ── Header block ───────────────────────────────────────────────────────────
    header_h = 58
    c.setFillColor(HEADER_BG)
    c.rect(MARGIN, y - header_h, INNER_W, header_h, fill=1, stroke=0)

    c.setFillColor(HEADER_TEXT)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN + 12, y - 16, "STATE OF ILLINOIS")
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN + 12, y - 26, "DEPARTMENT OF PUBLIC HEALTH")
    c.drawString(MARGIN + 12, y - 36, "DIVISION OF VITAL RECORDS")

    # Seal circle
    seal_cx = MARGIN + 165
    seal_cy = y - header_h / 2
    c.setStrokeColor(HexColor("#ffffff"))
    c.setLineWidth(1)
    c.circle(seal_cx, seal_cy, 18, fill=0, stroke=1)
    c.circle(seal_cx, seal_cy, 14, fill=0, stroke=1)
    c.setFillColor(HEADER_TEXT)
    c.setFont("Helvetica-Bold", 5)
    c.drawCentredString(seal_cx, seal_cy + 4, "SEAL OF")
    c.drawCentredString(seal_cx, seal_cy - 2, "THE STATE")
    c.drawCentredString(seal_cx, seal_cy - 8, "OF ILLINOIS")

    # Title
    title_x = MARGIN + INNER_W / 2 + 40
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(title_x, y - 22, "CERTIFICATE OF DEATH")

    # File number
    c.setFont("Helvetica", 7)
    c.drawRightString(MARGIN + INNER_W - 12, y - 14, "STATE FILE NUMBER")
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(MARGIN + INNER_W - 12, y - 26, "2026-LS-001247")

    c.setFont("Helvetica", 6)
    c.drawCentredString(title_x, y - 36, "THIS COPY IS NOT VALID UNLESS PREPARED")
    c.drawCentredString(title_x, y - 44, "ON ENGRAVED BORDER SECURITY PAPER")

    y -= header_h + 6

    # ── Section 1: Decedent ────────────────────────────────────────────────────
    draw_section_header(c, MARGIN, y - BAR_H, "Section 1 — Decedent Information", INNER_W)
    y -= BAR_H + POST_BAR

    col3 = INNER_W / 3 - 4
    col2 = INNER_W / 2 - 3

    # Row 1: Name
    draw_field(c, MARGIN, y - FIELD_H, "1a. Legal Name — First", "John", col3)
    draw_field(c, MARGIN + col3 + 6, y - FIELD_H, "1b. Middle", "Michael", col3)
    draw_field(c, MARGIN + 2 * (col3 + 6), y - FIELD_H, "1c. Last", "Smith", col3)
    y -= ROW_GAP

    # Row 2: Sex, DOB, SSN, Age
    q = INNER_W / 4 - 4.5
    draw_field(c, MARGIN, y - FIELD_H, "2. Sex", "Male", q)
    draw_field(c, MARGIN + q + 6, y - FIELD_H, "3. Date of Birth", "April 15, 1968", q)
    draw_field(c, MARGIN + 2 * (q + 6), y - FIELD_H, "4. SSN (last 4)", "XXX-XX-4471", q)
    draw_field(c, MARGIN + 3 * (q + 6), y - FIELD_H, "5. Age", "57 years", q)
    y -= ROW_GAP

    # Row 3: Birthplace, Marital, Spouse
    draw_field(c, MARGIN, y - FIELD_H, "6. Birthplace (State)", "Illinois", col3)
    draw_field(c, MARGIN + col3 + 6, y - FIELD_H, "7. Marital Status", "Married", col3)
    draw_field(c, MARGIN + 2 * (col3 + 6), y - FIELD_H, "8. Surviving Spouse", "Sarah Smith", col3)
    y -= ROW_GAP

    # Row 4: Residence
    draw_field(c, MARGIN, y - FIELD_H, "9a. Street Address", "1847 N. Damen Ave", col2)
    draw_field(c, MARGIN + col2 + 6, y - FIELD_H, "9b. City", "Chicago", col3 - 16)
    draw_field(c, MARGIN + col2 + col3 - 10, y - FIELD_H, "9c. State", "IL", 48)
    draw_field(c, MARGIN + col2 + col3 + 44, y - FIELD_H, "9d. Zip", "60647", 62)
    y -= ROW_GAP

    # Row 5: County, Education, Occupation
    draw_field(c, MARGIN, y - FIELD_H, "10. County of Residence", "Cook", col3)
    draw_field(c, MARGIN + col3 + 6, y - FIELD_H, "11. Education", "Bachelor's Degree", col3)
    draw_field(c, MARGIN + 2 * (col3 + 6), y - FIELD_H, "12. Usual Occupation", "Financial Analyst", col3)
    y -= SECT_BEFORE

    # ── Section 2: Death ───────────────────────────────────────────────────────
    draw_section_header(c, MARGIN, y - BAR_H, "Section 2 — Date, Place, and Circumstances of Death", INNER_W)
    y -= BAR_H + POST_BAR

    draw_field(c, MARGIN, y - FIELD_H, "13. Date of Death", "March 3, 2026", col3)
    draw_field(c, MARGIN + col3 + 6, y - FIELD_H, "14. Time of Death", "10:47", col3)
    draw_field(c, MARGIN + 2 * (col3 + 6), y - FIELD_H, "15. County of Death", "LaSalle", col3)
    y -= ROW_GAP

    draw_field(c, MARGIN, y - FIELD_H, "16. Place of Death", "Other — Outdoors", col2)
    draw_field(c, MARGIN + col2 + 6, y - FIELD_H, "17. Facility Name", "Starved Rock State Park", col2)
    y -= ROW_GAP

    draw_field(c, MARGIN, y - FIELD_H, "18. Facility Address", "Starved Rock State Park, 2678 E 875th Rd, Utica, IL 61373", INNER_W)
    y -= ROW_GAP

    # Informant row
    draw_field(c, MARGIN, y - FIELD_H, "18a. Informant Name", "Sarah Smith (Wife)", col2)
    draw_field(c, MARGIN + col2 + 6, y - FIELD_H, "18b. Informant Note", "Present at time of incident", col2)
    y -= SECT_BEFORE

    # ── Section 3: Cause of Death ──────────────────────────────────────────────
    draw_section_header(c, MARGIN, y - BAR_H, "Section 3 — Cause of Death", INNER_W)
    y -= BAR_H + POST_BAR

    # Cause of death chain box
    cod_h = 78
    c.setFillColor(FIELD_BG)
    c.roundRect(MARGIN, y - cod_h, INNER_W, cod_h, 2, fill=1, stroke=0)

    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 6)
    c.drawString(MARGIN + 4, y - 8, "19. CAUSE OF DEATH (See instructions and examples)")

    lx = MARGIN + 10

    # Line a
    ly = y - 20
    c.setFillColor(MID)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(lx, ly, "a.")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    c.drawString(lx + 13, ly, "Blunt force trauma to head and neck")
    c.setFillColor(MID)
    c.setFont("Helvetica", 7)
    c.drawRightString(MARGIN + INNER_W - 8, ly, "Onset to Death: Minutes")

    # "Due to" label
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 5.5)
    c.drawString(lx + 13, ly - 9, "Due to, or as a consequence of:")

    # Line b
    ly -= 18
    c.setFillColor(MID)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(lx, ly, "b.")
    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    c.drawString(lx + 13, ly, "Fall from height (~40 ft) during recreational rock climbing")
    c.setFillColor(MID)
    c.setFont("Helvetica", 7)
    c.drawRightString(MARGIN + INNER_W - 8, ly, "Onset to Death: Minutes")

    # Line c (blank)
    ly -= 16
    c.setFillColor(MID)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(lx, ly, "c.")

    # Line d (blank)
    ly -= 14
    c.setFillColor(MID)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(lx, ly, "d.")

    y -= cod_h + 4

    # Manner of death row
    draw_field(c, MARGIN, y - FIELD_H, "20. Manner of Death", "Accident", col3)
    draw_field(c, MARGIN + col3 + 6, y - FIELD_H, "21. Autopsy Performed?", "Yes", col3)
    draw_field(c, MARGIN + 2 * (col3 + 6), y - FIELD_H, "22. Tobacco Contribute?", "No", col3)
    y -= SECT_BEFORE

    # ── Section 4: Certifier ───────────────────────────────────────────────────
    draw_section_header(c, MARGIN, y - BAR_H, "Section 4 — Certifier", INNER_W)
    y -= BAR_H + POST_BAR

    draw_field(c, MARGIN, y - FIELD_H, "23. Certifier Type", "Medical Examiner", col3)
    draw_field(c, MARGIN + col3 + 6, y - FIELD_H, "24. Certifier Name", "Dr. Michael Torres, MD", col3)
    draw_field(c, MARGIN + 2 * (col3 + 6), y - FIELD_H, "25. License No.", "036-112459", col3)
    y -= ROW_GAP

    draw_field(c, MARGIN, y - FIELD_H, "26. Date Certified", "March 4, 2026", col2)
    draw_field(c, MARGIN + col2 + 6, y - FIELD_H, "27. Date Filed", "March 5, 2026", col2)
    y -= ROW_GAP

    draw_field(c, MARGIN, y - FIELD_H, "28. Certifier Address", "LaSalle County Coroner's Office, 707 E. Etna Rd, Ottawa, IL 61350", INNER_W)
    y -= FIELD_H + 4

    # ── Signature line ─────────────────────────────────────────────────────────
    sig_y = y - 14  # leave room for the handwriting above the line
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(MARGIN, sig_y, MARGIN + 190, sig_y)

    c.setFillColor(HexColor("#1a3366"))
    c.setFont("Helvetica-Oblique", 11)
    c.drawString(MARGIN + 8, sig_y + 3, "M. Torres, MD")

    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 6)
    c.drawString(MARGIN, sig_y - 9, "SIGNATURE OF CERTIFIER")
    c.drawString(MARGIN + 210, sig_y - 9, "DATE: March 4, 2026")

    # ── Registrar ──────────────────────────────────────────────────────────────
    y = sig_y - 18
    draw_horizontal_rule(c, MARGIN, y, INNER_W)
    c.setFillColor(MID)
    c.setFont("Helvetica", 5.5)
    c.drawString(MARGIN, y - 8, "REGISTRAR: LaSalle County Clerk's Office")
    c.drawString(MARGIN + 220, y - 8, "REGISTERED: March 5, 2026")
    c.drawRightString(MARGIN + INNER_W, y - 8, "STATE FILE NO: 2026-LS-001247")

    # ── Footer ─────────────────────────────────────────────────────────────────
    y -= 16
    draw_horizontal_rule(c, MARGIN, y, INNER_W)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 5)
    c.drawCentredString(WIDTH / 2, y - 7,
        "THIS IS A CERTIFIED COPY OF THE ORIGINAL FILED WITH THE ILLINOIS DEPARTMENT OF PUBLIC HEALTH")
    c.drawCentredString(WIDTH / 2, y - 14,
        "ANY ALTERATIONS OR ERASURES VOID THIS CERTIFICATE  |  SPECIMEN  |  NOT FOR LEGAL USE")
    c.drawCentredString(WIDTH / 2, y - 21,
        "IOCI 24-0471  |  Printed by Authority of the State of Illinois  |  Rev. 01/2024")

    # ── Watermark ──────────────────────────────────────────────────────────────
    c.saveState()
    c.setFillColor(HexColor("#e8e8e8"))
    c.setFont("Helvetica-Bold", 48)
    c.translate(WIDTH / 2, HEIGHT / 2)
    c.rotate(45)
    c.drawCentredString(0, 0, "SPECIMEN")
    c.restoreState()

    c.save()
    print(f"Generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    generate()
