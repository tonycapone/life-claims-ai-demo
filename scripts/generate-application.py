"""
Generate a realistic synthetic insurance application PDF for the ClaimPath demo.
Subject: John Michael Smith (policy LT-29471)

Usage:  python scripts/generate-application.py
Output: frontend/public/demo/application-smith.pdf
"""

import os
from datetime import date, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "demo")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "application-smith.pdf")

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
CHECK_GREEN = HexColor("#16a34a")
CHECK_RED = HexColor("#dc2626")

# ── Page setup ─────────────────────────────────────────────────────────────────
WIDTH, HEIGHT = letter
MARGIN = 0.6 * inch
INNER_W = WIDTH - 2 * MARGIN

# ── Spacing constants ──────────────────────────────────────────────────────────
FIELD_H = 26
ROW_GAP = 30
SECT_BEFORE = 28
BAR_H = 14
POST_BAR = 18

# Application date: 14 months ago (matches policy issue)
today = date.today()
app_date = today - timedelta(days=14 * 30)
app_date_str = app_date.strftime("%B %d, %Y")


def draw_field(c, x, y, label, value, width, height=FIELD_H):
    """Draw a labeled form field with background."""
    c.setFillColor(FIELD_BG)
    c.roundRect(x, y, width, height, 2, fill=1, stroke=0)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 5.5)
    c.drawString(x + 4, y + height - 8, label.upper())
    c.setFillColor(DARK)
    c.setFont("Helvetica", 8.5)
    c.drawString(x + 4, y + 4, value)


def draw_section_header(c, x, y, title, width):
    """Draw a section header bar."""
    c.setFillColor(ACCENT)
    c.roundRect(x, y, width, BAR_H, 2, fill=1, stroke=0)
    c.setFillColor(HEADER_TEXT)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(x + 6, y + 3.5, title.upper())
    return y


def draw_yes_no(c, x, y, question, answer, width, num=""):
    """Draw a yes/no health question row."""
    row_h = 22
    # Alternating background
    c.setFillColor(FIELD_BG)
    c.roundRect(x, y, width, row_h, 1, fill=1, stroke=0)

    # Question number and text
    c.setFillColor(DARK)
    c.setFont("Helvetica", 8)
    q_text = f"{num}  {question}" if num else question
    c.drawString(x + 6, y + 7, q_text)

    # Yes/No boxes
    box_size = 10
    yes_x = x + width - 80
    no_x = x + width - 40

    c.setFont("Helvetica", 6.5)
    c.setFillColor(MID)
    c.drawString(yes_x, y + 13, "YES")
    c.drawString(no_x, y + 13, "NO")

    # Draw checkbox outlines
    c.setStrokeColor(RULE_COLOR)
    c.setLineWidth(0.75)
    c.rect(yes_x, y + 4, box_size, box_size)
    c.rect(no_x, y + 4, box_size, box_size)

    # Fill in the answer
    if answer.lower() == "yes":
        c.setFillColor(CHECK_RED)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(yes_x + box_size / 2, y + 5.5, "X")
    else:
        c.setFillColor(CHECK_GREEN)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(no_x + box_size / 2, y + 5.5, "X")

    return y


def generate():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=letter)
    c.setTitle("Life Insurance Application - John Michael Smith")
    c.setAuthor("Tidewell Life Insurance Company")

    y = HEIGHT - MARGIN

    # ── Outer border ───────────────────────────────────────────────────────────
    c.setStrokeColor(BORDER)
    c.setLineWidth(1.5)
    c.rect(MARGIN - 6, MARGIN - 6, INNER_W + 12, HEIGHT - 2 * MARGIN + 12)

    # ── Header block ───────────────────────────────────────────────────────────
    header_h = 52
    c.setFillColor(HEADER_BG)
    c.rect(MARGIN, y - header_h, INNER_W, header_h, fill=1, stroke=0)

    c.setFillColor(HEADER_TEXT)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN + 14, y - 20, "TIDEWELL LIFE INSURANCE COMPANY")
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN + 14, y - 32, "Application for Individual Life Insurance")
    c.setFont("Helvetica", 6.5)
    c.drawString(MARGIN + 14, y - 43, "Form TL-APP-2024  |  Revision 03/2024")

    # Application number
    c.setFont("Helvetica", 6.5)
    c.drawRightString(MARGIN + INNER_W - 14, y - 16, "APPLICATION NUMBER")
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(MARGIN + INNER_W - 14, y - 28, "APP-2025-07821")

    y -= header_h + 8

    # ── Section 1: Proposed Insured ────────────────────────────────────────────
    draw_section_header(c, MARGIN, y - BAR_H, "Section 1 — Proposed Insured Information", INNER_W)
    y -= BAR_H + POST_BAR

    col3 = INNER_W / 3 - 4
    col2 = INNER_W / 2 - 3

    # Row 1: Name
    draw_field(c, MARGIN, y - FIELD_H, "First Name", "John", col3)
    draw_field(c, MARGIN + col3 + 6, y - FIELD_H, "Middle Name", "Michael", col3)
    draw_field(c, MARGIN + 2 * (col3 + 6), y - FIELD_H, "Last Name", "Smith", col3)
    y -= ROW_GAP

    # Row 2: DOB, SSN, Sex
    draw_field(c, MARGIN, y - FIELD_H, "Date of Birth", "April 15, 1968", col3)
    draw_field(c, MARGIN + col3 + 6, y - FIELD_H, "Social Security Number", "XXX-XX-4471", col3)
    draw_field(c, MARGIN + 2 * (col3 + 6), y - FIELD_H, "Sex", "Male", col3)
    y -= ROW_GAP

    # Row 3: Address
    draw_field(c, MARGIN, y - FIELD_H, "Street Address", "1847 N. Damen Ave", col2)
    draw_field(c, MARGIN + col2 + 6, y - FIELD_H, "City", "Chicago", col2)
    y -= ROW_GAP

    # Row 4: State, Zip, Phone
    draw_field(c, MARGIN, y - FIELD_H, "State", "Illinois", col3)
    draw_field(c, MARGIN + col3 + 6, y - FIELD_H, "Zip Code", "60647", col3)
    draw_field(c, MARGIN + 2 * (col3 + 6), y - FIELD_H, "Phone", "(312) 555-0147", col3)
    y -= ROW_GAP

    # Row 5: Occupation, Employer, Income
    draw_field(c, MARGIN, y - FIELD_H, "Occupation", "Financial Analyst", col3)
    draw_field(c, MARGIN + col3 + 6, y - FIELD_H, "Employer", "Midwest Capital Partners", col3)
    draw_field(c, MARGIN + 2 * (col3 + 6), y - FIELD_H, "Annual Income", "$125,000", col3)
    y -= SECT_BEFORE + 2

    # ── Section 2: Coverage Requested ──────────────────────────────────────────
    draw_section_header(c, MARGIN, y - BAR_H, "Section 2 — Coverage Requested", INNER_W)
    y -= BAR_H + POST_BAR

    draw_field(c, MARGIN, y - FIELD_H, "Type of Insurance", "Term Life — 20 Year Level", col2)
    draw_field(c, MARGIN + col2 + 6, y - FIELD_H, "Face Amount", "$500,000.00", col2)
    y -= ROW_GAP

    draw_field(c, MARGIN, y - FIELD_H, "Primary Beneficiary", "Sarah Smith (Spouse) — 100%", INNER_W)
    y -= SECT_BEFORE + 2

    # ── Section 3: Health History Questionnaire ────────────────────────────────
    draw_section_header(c, MARGIN, y - BAR_H, "Section 3 — Health History Questionnaire", INNER_W)
    y -= BAR_H + 4

    c.setFillColor(MID)
    c.setFont("Helvetica-Oblique", 6.5)
    c.drawString(MARGIN + 6, y - 10,
                 "Please answer each question truthfully and completely. Material misrepresentations may result in rescission of the policy.")
    y -= 16

    # Health questions with answers
    # IMPORTANT: Questions 1, 2, and 4 are FALSE answers (misrepresentations)
    questions = [
        ("1.", "Have you ever been diagnosed with or treated for any form of heart disease,\n     including but not limited to coronary artery disease, arrhythmia, or heart failure?", "No"),
        ("2.", "Have you been prescribed medication for high blood pressure (hypertension)?", "No"),
        ("3.", "Have you ever been diagnosed with or treated for diabetes (Type 1 or Type 2)?", "No"),
        ("4.", "Have you been hospitalized or visited an emergency room in the past 5 years\n     for any reason?", "No"),
        ("5.", "Have you ever been diagnosed with or treated for cancer or any malignancy?", "No"),
        ("6.", "Have you used tobacco or nicotine products in the past 5 years?", "No"),
        ("7.", "Have you ever been diagnosed with or treated for a mental health condition,\n     including anxiety or depression?", "No"),
        ("8.", "Have you ever been diagnosed with or treated for kidney disease or liver disease?", "No"),
        ("9.", "Have you had any surgeries in the past 10 years?", "No"),
        ("10.", "Are you currently taking any prescription medications?", "No"),
        ("11.", "Have you ever been declined for life insurance or had an application rated\n      or modified?", "No"),
        ("12.", "Do you participate in any hazardous activities (e.g., skydiving, scuba diving,\n      motorsports, rock climbing)?", "No"),
    ]

    q_row_h = 24
    for num, question, answer in questions:
        # Handle multiline questions
        lines = question.split("\n")
        actual_h = q_row_h if len(lines) == 1 else q_row_h + 10

        draw_yes_no(c, MARGIN, y - actual_h, lines[0], answer, INNER_W, num)

        if len(lines) > 1:
            c.setFillColor(DARK)
            c.setFont("Helvetica", 8)
            c.drawString(MARGIN + 6, y - actual_h + 7 - 10, lines[1].strip())

        y -= actual_h + 3

    y -= 6

    # ── Section 4: Additional Information ──────────────────────────────────────
    draw_section_header(c, MARGIN, y - BAR_H, "Section 4 — Additional Information", INNER_W)
    y -= BAR_H + POST_BAR

    note_h = 32
    c.setFillColor(FIELD_BG)
    c.roundRect(MARGIN, y - note_h, INNER_W, note_h, 2, fill=1, stroke=0)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 5.5)
    c.drawString(MARGIN + 4, y - 8, "ADDITIONAL NOTES OR EXPLANATIONS")
    c.setFillColor(MID)
    c.setFont("Helvetica-Oblique", 7.5)
    c.drawString(MARGIN + 6, y - 22, "No additional information to disclose.")
    y -= note_h + 10

    # ── Section 5: Acknowledgment & Signature ──────────────────────────────────
    draw_section_header(c, MARGIN, y - BAR_H, "Section 5 — Acknowledgment & Signature", INNER_W)
    y -= BAR_H + POST_BAR

    ack_text = [
        "I hereby declare that the statements and answers in this application are complete and true to the",
        "best of my knowledge and belief. I understand that any material misrepresentation or concealment",
        "of facts may result in the rescission of any policy issued based on this application, in accordance",
        "with applicable state insurance law. I authorize any physician, hospital, or other medical provider",
        "to release information regarding my health history to Tidewell Life Insurance Company.",
    ]
    c.setFillColor(MID)
    c.setFont("Helvetica", 7)
    line_y = y
    for line in ack_text:
        c.drawString(MARGIN + 4, line_y, line)
        line_y -= 10
    y = line_y - 10

    # Signature line
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(MARGIN, y, MARGIN + 220, y)

    c.setFillColor(HexColor("#1a3366"))
    c.setFont("Helvetica-Oblique", 11)
    c.drawString(MARGIN + 8, y + 4, "John M. Smith")

    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 6)
    c.drawString(MARGIN, y - 9, "SIGNATURE OF PROPOSED INSURED")

    # Date
    c.drawString(MARGIN + 260, y - 9, f"DATE: {app_date_str}")
    c.setStrokeColor(BORDER)
    c.line(MARGIN + 260, y, MARGIN + 420, y)
    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN + 268, y + 4, app_date_str)

    # Agent signature
    y -= 28
    c.setStrokeColor(BORDER)
    c.line(MARGIN, y, MARGIN + 220, y)
    c.setFillColor(HexColor("#1a3366"))
    c.setFont("Helvetica-Oblique", 11)
    c.drawString(MARGIN + 8, y + 4, "D. Morrison")

    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 6)
    c.drawString(MARGIN, y - 9, "SIGNATURE OF AGENT / BROKER")
    c.drawString(MARGIN + 260, y - 9, "AGENT CODE: TW-1148")

    # ── Footer ─────────────────────────────────────────────────────────────────
    y -= 24
    c.setStrokeColor(RULE_COLOR)
    c.setLineWidth(0.5)
    c.line(MARGIN, y, MARGIN + INNER_W, y)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 5)
    c.drawCentredString(WIDTH / 2, y - 8,
                        "TIDEWELL LIFE INSURANCE COMPANY  |  200 N. LaSalle St, Suite 1400, Chicago, IL 60601  |  (800) 555-0199")
    c.drawCentredString(WIDTH / 2, y - 15,
                        "Form TL-APP-2024  |  This application is subject to the terms and conditions of the policy contract")

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
