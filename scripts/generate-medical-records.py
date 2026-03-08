"""
Generate synthetic medical records PDF for the ClaimPath demo.
Subject: John Michael Smith (policy LT-29471)

These records contain entries that CONTRADICT the insurance application answers,
forming the basis for the contestability analysis demo.

Usage:  python scripts/generate-medical-records.py
Output: frontend/public/demo/medical-records-smith.pdf
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
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "medical-records-smith.pdf")

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
SECTION_BG = HexColor("#f0f4f8")
DATE_COLOR = HexColor("#1a4d8c")

# ── Page setup ─────────────────────────────────────────────────────────────────
WIDTH, HEIGHT = letter
MARGIN = 0.6 * inch
INNER_W = WIDTH - 2 * MARGIN


def draw_page_header(c, y, page_num, total_pages):
    """Draw the medical records header on each page."""
    header_h = 48
    c.setFillColor(HEADER_BG)
    c.rect(MARGIN, y - header_h, INNER_W, header_h, fill=1, stroke=0)

    c.setFillColor(HEADER_TEXT)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 14, y - 18, "LAKEVIEW INTERNAL MEDICINE")
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN + 14, y - 28, "2847 N. Lincoln Ave, Suite 200  |  Chicago, IL 60657")
    c.drawString(MARGIN + 14, y - 38, "Phone: (773) 555-0234  |  Fax: (773) 555-0235  |  NPI: 1234567890")

    # Right side: patient info
    c.setFont("Helvetica-Bold", 7)
    c.drawRightString(MARGIN + INNER_W - 14, y - 14, "MEDICAL RECORDS SUMMARY")
    c.setFont("Helvetica", 6.5)
    c.drawRightString(MARGIN + INNER_W - 14, y - 24, "Patient: Smith, John Michael")
    c.drawRightString(MARGIN + INNER_W - 14, y - 33, "DOB: 04/15/1968  |  MRN: LIM-2019-04471")
    c.drawRightString(MARGIN + INNER_W - 14, y - 42, f"Page {page_num} of {total_pages}")

    return y - header_h - 8


def draw_encounter(c, y, date, encounter_type, provider, content_lines,
                   vitals=None, medications=None, assessment=None, plan=None):
    """Draw a single medical encounter/note. Returns the new y position."""
    # Calculate total height needed
    line_h = 11
    needed = 20  # date header
    needed += len(content_lines) * line_h + 8
    if vitals:
        needed += line_h + 4
    if medications:
        needed += (len(medications) + 1) * line_h + 4
    if assessment:
        needed += (len(assessment) + 1) * line_h + 4
    if plan:
        needed += (len(plan) + 1) * line_h + 4
    needed += 12  # padding

    # Check if we need a new page
    if y - needed < MARGIN + 40:
        return None  # Signal that we need a new page

    # Date and encounter type header
    c.setFillColor(SECTION_BG)
    c.roundRect(MARGIN, y - 18, INNER_W, 18, 2, fill=1, stroke=0)

    c.setFillColor(DATE_COLOR)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN + 8, y - 13, date)

    c.setFillColor(MID)
    c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN + 100, y - 13, f"{encounter_type}  |  Provider: {provider}")

    y -= 24

    # Subjective / History of Present Illness
    c.setFillColor(DARK)
    c.setFont("Helvetica", 8)
    for line in content_lines:
        if line.startswith("**"):
            # Bold subsection header
            c.setFont("Helvetica-Bold", 7.5)
            c.setFillColor(MID)
            c.drawString(MARGIN + 8, y, line.replace("**", ""))
            c.setFont("Helvetica", 8)
            c.setFillColor(DARK)
        else:
            c.drawString(MARGIN + 8, y, line)
        y -= line_h

    # Vitals
    if vitals:
        y -= 2
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(MID)
        c.drawString(MARGIN + 8, y, "VITALS:")
        c.setFont("Helvetica", 7.5)
        c.setFillColor(DARK)
        c.drawString(MARGIN + 52, y, vitals)
        y -= line_h + 2

    # Medications
    if medications:
        y -= 2
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(MID)
        c.drawString(MARGIN + 8, y, "MEDICATIONS:")
        y -= line_h
        c.setFont("Helvetica", 7.5)
        c.setFillColor(DARK)
        for med in medications:
            c.drawString(MARGIN + 16, y, f"- {med}")
            y -= line_h

    # Assessment
    if assessment:
        y -= 2
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(MID)
        c.drawString(MARGIN + 8, y, "ASSESSMENT:")
        y -= line_h
        c.setFont("Helvetica", 7.5)
        c.setFillColor(DARK)
        for item in assessment:
            c.drawString(MARGIN + 16, y, item)
            y -= line_h

    # Plan
    if plan:
        y -= 2
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(MID)
        c.drawString(MARGIN + 8, y, "PLAN:")
        y -= line_h
        c.setFont("Helvetica", 7.5)
        c.setFillColor(DARK)
        for item in plan:
            c.drawString(MARGIN + 16, y, item)
            y -= line_h

    # Separator
    y -= 6
    c.setStrokeColor(RULE_COLOR)
    c.setLineWidth(0.5)
    c.line(MARGIN + 8, y, MARGIN + INNER_W - 8, y)
    y -= 8

    return y


def draw_footer(c, page_num):
    """Draw page footer."""
    footer_y = MARGIN + 6
    c.setStrokeColor(RULE_COLOR)
    c.setLineWidth(0.5)
    c.line(MARGIN, footer_y + 12, MARGIN + INNER_W, footer_y + 12)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 5)
    c.drawString(MARGIN, footer_y,
                 "CONFIDENTIAL MEDICAL RECORD  |  Protected Health Information under HIPAA  |  Unauthorized disclosure prohibited")
    c.drawRightString(MARGIN + INNER_W, footer_y,
                      f"Lakeview Internal Medicine  |  MRN: LIM-2019-04471  |  Generated: 03/05/2026")


def generate():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=letter)
    c.setTitle("Medical Records - John Michael Smith")
    c.setAuthor("Lakeview Internal Medicine")

    total_pages = 6
    page_num = 1

    # ═══════════════════════════════════════════════════════════════════════════
    # PAGE 1: Cover sheet + first encounters
    # ═══════════════════════════════════════════════════════════════════════════

    y = HEIGHT - MARGIN

    # Outer border
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.rect(MARGIN - 4, MARGIN - 4, INNER_W + 8, HEIGHT - 2 * MARGIN + 8)

    y = draw_page_header(c, y, page_num, total_pages)

    # Cover info box
    info_h = 60
    c.setFillColor(FIELD_BG)
    c.roundRect(MARGIN + 4, y - info_h, INNER_W - 8, info_h, 3, fill=1, stroke=0)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN + 12, y - 14, "RECORDS REQUEST FULFILLMENT")
    c.setFont("Helvetica", 7.5)
    c.setFillColor(MID)
    c.drawString(MARGIN + 12, y - 26, "Requested by: Tidewell Life Insurance Company (Authorization on file)")
    c.drawString(MARGIN + 12, y - 37, "Date range requested: January 2019 - March 2026 (all available records)")
    c.drawString(MARGIN + 12, y - 48, "Records prepared by: Medical Records Department  |  Release date: March 5, 2026")
    y -= info_h + 12

    # ── Encounter 1: AFib Diagnosis ────────────────────────────────────────────
    y = draw_encounter(c, y,
                       "June 15, 2023",
                       "Office Visit",
                       "Sarah Chen, MD",
                       [
                           "**CHIEF COMPLAINT:**",
                           "Patient presents with intermittent palpitations and irregular heartbeat",
                           "occurring over the past 3 weeks. Episodes last 10-30 minutes.",
                           "",
                           "**HISTORY OF PRESENT ILLNESS:**",
                           "57-year-old male with no significant prior cardiac history presents with",
                           "new-onset palpitations. Denies chest pain, syncope, or dyspnea. Reports",
                           "episodes occur at rest and with exertion. No recent illness or caffeine",
                           "increase. Family history significant for father with CAD (MI at age 62).",
                           "",
                           "**PHYSICAL EXAM:**",
                           "Heart: Irregularly irregular rhythm, no murmurs. Lungs: Clear bilateral.",
                           "",
                           "**DIAGNOSTIC RESULTS:**",
                           "ECG: Atrial fibrillation with controlled ventricular rate (78 bpm).",
                           "Echocardiogram ordered.",
                       ],
                       vitals="BP 142/88  |  HR 78 (irregular)  |  SpO2 98%  |  Temp 98.4F  |  Wt 198 lbs",
                       assessment=[
                           "1. New-onset atrial fibrillation (I48.91)",
                           "2. Borderline hypertension (R03.0)",
                       ],
                       medications=[
                           "Metoprolol succinate 25mg PO BID - START",
                           "Eliquis (apixaban) 5mg PO BID - START (stroke prophylaxis, CHA2DS2-VASc = 2)",
                       ],
                       plan=[
                           "1. Start metoprolol for rate control",
                           "2. Start anticoagulation per CHA2DS2-VASc score",
                           "3. Echocardiogram scheduled for 06/22/2023",
                           "4. Follow-up in 6-8 weeks for rate control assessment",
                           "5. Referred to Dr. Patel (Cardiology) for AFib management",
                       ])

    draw_footer(c, page_num)
    c.showPage()

    # ═══════════════════════════════════════════════════════════════════════════
    # PAGE 2: September 2023 follow-up + ER visit
    # ═══════════════════════════════════════════════════════════════════════════

    page_num = 2
    y = HEIGHT - MARGIN

    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.rect(MARGIN - 4, MARGIN - 4, INNER_W + 8, HEIGHT - 2 * MARGIN + 8)

    y = draw_page_header(c, y, page_num, total_pages)

    # ── Encounter 2: Hypertension follow-up ────────────────────────────────────
    y = draw_encounter(c, y,
                       "September 20, 2023",
                       "Follow-up Visit",
                       "Sarah Chen, MD",
                       [
                           "**CHIEF COMPLAINT:**",
                           "Follow-up for atrial fibrillation, review of echocardiogram results.",
                           "",
                           "**INTERVAL HISTORY:**",
                           "Patient reports improved palpitations on metoprolol. Occasional episodes",
                           "of rapid heartbeat but less frequent. Tolerating Eliquis without bleeding.",
                           "Echocardiogram (06/22): EF 55%, mild LA enlargement, no valvular disease.",
                           "",
                           "**PHYSICAL EXAM:**",
                           "Heart: Controlled rate, occasional irregularity. BP elevated today.",
                       ],
                       vitals="BP 148/92  |  HR 72  |  SpO2 99%  |  Temp 98.6F  |  Wt 201 lbs",
                       assessment=[
                           "1. Atrial fibrillation — rate controlled on metoprolol (I48.91)",
                           "2. Hypertension, newly diagnosed (I10)",
                           "3. Mild left atrial enlargement on echo",
                       ],
                       medications=[
                           "Metoprolol succinate 25mg PO BID - CONTINUE",
                           "Eliquis 5mg PO BID - CONTINUE",
                           "Lisinopril 10mg PO daily - START (hypertension)",
                       ],
                       plan=[
                           "1. Start lisinopril 10mg for blood pressure control",
                           "2. Home BP monitoring — target < 130/80",
                           "3. Continue current AFib regimen",
                           "4. BMP in 2 weeks to check renal function/potassium on ACE inhibitor",
                           "5. Follow-up 3 months",
                       ])

    draw_footer(c, page_num)
    c.showPage()

    # ═══════════════════════════════════════════════════════════════════════════
    # PAGE 3: ER Visit (March 2024)
    # ═══════════════════════════════════════════════════════════════════════════

    page_num = 3
    y = HEIGHT - MARGIN

    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.rect(MARGIN - 4, MARGIN - 4, INNER_W + 8, HEIGHT - 2 * MARGIN + 8)

    y = draw_page_header(c, y, page_num, total_pages)

    # ── Encounter 3: ER Visit ──────────────────────────────────────────────────
    y = draw_encounter(c, y,
                       "March 10, 2024",
                       "EMERGENCY DEPARTMENT VISIT",
                       "James Wilson, MD (Emergency Medicine)",
                       [
                           "**CHIEF COMPLAINT:**",
                           "Acute onset chest pain, left-sided, radiating to left arm.",
                           "",
                           "**HISTORY OF PRESENT ILLNESS:**",
                           "56-year-old male with history of atrial fibrillation and hypertension",
                           "presents to ED via EMS with acute chest pain onset 45 minutes prior to",
                           "arrival. Pain described as pressure-like, 7/10 severity, radiating to",
                           "left arm and jaw. Associated with diaphoresis and mild dyspnea. Denies",
                           "nausea or vomiting. Currently on metoprolol, Eliquis, and lisinopril.",
                           "",
                           "**ED COURSE:**",
                           "ECG on arrival: AFib with rate 94, no acute ST changes. Serial troponins",
                           "negative x2 (0.01, 0.01 ng/mL at 0 and 3 hours). Chest X-ray: no acute",
                           "cardiopulmonary process. D-dimer negative. Pain resolved with sublingual",
                           "nitroglycerin.",
                           "",
                           "**PHYSICAL EXAM:**",
                           "Alert, mild distress. Heart: irregularly irregular, no murmurs or gallops.",
                           "Lungs: Clear. Abdomen: Soft, non-tender.",
                       ],
                       vitals="BP 158/96  |  HR 94 (irregular)  |  SpO2 97%  |  Temp 98.2F  |  RR 18",
                       assessment=[
                           "1. Acute chest pain — rule out MI — TROPONIN NEGATIVE x2 (R07.9)",
                           "2. Atrial fibrillation with rapid ventricular response (I48.91)",
                           "3. Hypertension, uncontrolled in setting of acute pain (I10)",
                       ],
                       medications=[
                           "Sublingual nitroglycerin 0.4mg x1 — pain resolved",
                           "Metoprolol succinate 25mg PO BID - CONTINUE",
                           "Eliquis 5mg PO BID - CONTINUE",
                           "Lisinopril 10mg PO daily - CONTINUE",
                       ],
                       plan=[
                           "1. Discharge home — troponins negative, pain resolved",
                           "2. Follow-up with PCP within 1 week",
                           "3. Follow-up with Cardiology within 2 weeks",
                           "4. Stress test to be arranged as outpatient",
                           "5. Return to ED if chest pain recurs, worsens, or new symptoms develop",
                       ])

    draw_footer(c, page_num)
    c.showPage()

    # ═══════════════════════════════════════════════════════════════════════════
    # PAGE 4: Annual physical
    # ═══════════════════════════════════════════════════════════════════════════

    page_num = 4
    y = HEIGHT - MARGIN

    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.rect(MARGIN - 4, MARGIN - 4, INNER_W + 8, HEIGHT - 2 * MARGIN + 8)

    y = draw_page_header(c, y, page_num, total_pages)

    # ── Encounter 4: Annual physical ───────────────────────────────────────────
    y = draw_encounter(c, y,
                       "August 5, 2024",
                       "Annual Physical Examination",
                       "Sarah Chen, MD",
                       [
                           "**REASON FOR VISIT:**",
                           "Annual preventive exam and chronic disease management.",
                           "",
                           "**INTERVAL HISTORY:**",
                           "Patient doing well overall. AFib rate controlled on metoprolol — reports",
                           "rare palpitations. BP improved on lisinopril but still borderline at times.",
                           "Had ER visit in March for chest pain (troponins negative). Stress test",
                           "(04/2024) showed no inducible ischemia. Reports good exercise tolerance.",
                           "Walking 30 min daily. Quit smoking 7 years ago. No alcohol. Diet improved.",
                           "",
                           "**REVIEW OF SYSTEMS:**",
                           "Denies chest pain, palpitations, syncope, edema, dyspnea on exertion.",
                           "",
                           "**PHYSICAL EXAM:**",
                           "General: Well-appearing, NAD. Heart: Irregularly irregular, rate controlled.",
                           "Lungs: CTA bilaterally. Extremities: No edema. Neuro: Intact.",
                       ],
                       vitals="BP 134/84  |  HR 68  |  SpO2 99%  |  Temp 98.4F  |  Wt 196 lbs  |  BMI 28.4",
                       assessment=[
                           "1. Atrial fibrillation, persistent, rate controlled (I48.91)",
                           "2. Hypertension, improved but above target (I10)",
                           "3. Hyperlipidemia, newly identified (E78.5) — TC 248, LDL 162, HDL 42, TG 220",
                           "4. Overweight (BMI 28.4) (E66.3)",
                       ],
                       medications=[
                           "Metoprolol succinate 25mg PO BID - CONTINUE",
                           "Eliquis 5mg PO BID - CONTINUE",
                           "Lisinopril 10mg PO daily - INCREASE to 20mg",
                           "Atorvastatin 20mg PO daily - START (LDL 162, target < 100 given AFib + HTN)",
                       ],
                       plan=[
                           "1. Increase lisinopril to 20mg for better BP control",
                           "2. Start atorvastatin for lipid management — elevated CV risk profile",
                           "3. Continue AFib regimen — rate well controlled",
                           "4. Recheck lipids and LFTs in 8 weeks",
                           "5. Continue exercise, weight management counseling",
                           "6. Follow-up 6 months or sooner if issues",
                       ])

    draw_footer(c, page_num)
    c.showPage()

    # ═══════════════════════════════════════════════════════════════════════════
    # PAGE 5: Routine follow-up + summary tables
    # ═══════════════════════════════════════════════════════════════════════════

    page_num = 5
    y = HEIGHT - MARGIN

    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.rect(MARGIN - 4, MARGIN - 4, INNER_W + 8, HEIGHT - 2 * MARGIN + 8)

    y = draw_page_header(c, y, page_num, total_pages)

    # ── Encounter 5: Routine follow-up ─────────────────────────────────────────
    y = draw_encounter(c, y,
                       "January 12, 2025",
                       "Follow-up Visit",
                       "Sarah Chen, MD",
                       [
                           "**CHIEF COMPLAINT:**",
                           "Routine follow-up for atrial fibrillation, hypertension, and hyperlipidemia.",
                           "",
                           "**INTERVAL HISTORY:**",
                           "Patient reports compliance with all medications including new atorvastatin.",
                           "No side effects — no myalgias or GI issues. Palpitations rare. BP readings",
                           "at home averaging 128/78. Exercising regularly. No chest pain since ER visit.",
                           "Repeat lipid panel: TC 198, LDL 108, HDL 48, TG 180 — significant improvement.",
                           "LFTs normal. Renal function stable (Cr 1.0, eGFR 82).",
                           "",
                           "**PHYSICAL EXAM:**",
                           "Heart: Irregularly irregular, rate controlled, no murmurs.",
                           "BP well-controlled today. No peripheral edema.",
                       ],
                       vitals="BP 126/78  |  HR 66  |  SpO2 99%  |  Temp 98.5F  |  Wt 192 lbs  |  BMI 27.8",
                       assessment=[
                           "1. Atrial fibrillation, persistent, well-controlled (I48.91)",
                           "2. Hypertension, controlled on lisinopril 20mg (I10)",
                           "3. Hyperlipidemia, improved on atorvastatin (E78.5)",
                           "4. History of ER visit for chest pain (March 2024) — resolved",
                       ],
                       medications=[
                           "Metoprolol succinate 25mg PO BID - CONTINUE",
                           "Eliquis 5mg PO BID - CONTINUE",
                           "Lisinopril 20mg PO daily - CONTINUE",
                           "Atorvastatin 20mg PO daily - CONTINUE",
                       ],
                       plan=[
                           "1. Continue all current medications — well-tolerated and effective",
                           "2. Annual labs due August 2025",
                           "3. Continue lifestyle modifications (diet, exercise, weight management)",
                           "4. Follow-up 6 months or PRN",
                       ])

    # ── Medication History Summary ─────────────────────────────────────────────
    c.setFillColor(SECTION_BG)
    c.roundRect(MARGIN + 4, y - 16, INNER_W - 8, 16, 2, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(MARGIN + 12, y - 12, "ACTIVE MEDICATION LIST (as of last visit 01/12/2025)")
    y -= 24

    meds_list = [
        ("Metoprolol succinate 25mg", "PO BID", "06/15/2023", "Rate control - atrial fibrillation"),
        ("Apixaban (Eliquis) 5mg", "PO BID", "06/15/2023", "Anticoagulation - AFib stroke prevention"),
        ("Lisinopril 20mg", "PO daily", "09/20/2023", "Hypertension (increased from 10mg on 08/05/2024)"),
        ("Atorvastatin 20mg", "PO daily", "08/05/2024", "Hyperlipidemia / CV risk reduction"),
    ]

    # Table header
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(MID)
    c.drawString(MARGIN + 12, y, "MEDICATION")
    c.drawString(MARGIN + 200, y, "DOSE")
    c.drawString(MARGIN + 268, y, "STARTED")
    c.drawString(MARGIN + 340, y, "INDICATION")
    y -= 4
    c.setStrokeColor(RULE_COLOR)
    c.line(MARGIN + 8, y, MARGIN + INNER_W - 8, y)
    y -= 10

    c.setFont("Helvetica", 7)
    c.setFillColor(DARK)
    for med_name, dose, start, indication in meds_list:
        c.drawString(MARGIN + 12, y, med_name)
        c.drawString(MARGIN + 200, y, dose)
        c.drawString(MARGIN + 268, y, start)
        c.drawString(MARGIN + 340, y, indication)
        y -= 12

    y -= 6

    # ── Problem List / Medical History Summary ─────────────────────────────────
    c.setFillColor(SECTION_BG)
    c.roundRect(MARGIN + 4, y - 16, INNER_W - 8, 16, 2, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(MARGIN + 12, y - 12, "ACTIVE PROBLEM LIST")
    y -= 24

    problems = [
        ("I48.91", "Atrial fibrillation, unspecified", "06/15/2023", "Active"),
        ("I10", "Essential hypertension", "09/20/2023", "Active"),
        ("E78.5", "Hyperlipidemia, unspecified", "08/05/2024", "Active"),
        ("R07.9", "Chest pain, unspecified (ER 03/2024)", "03/10/2024", "Resolved"),
    ]

    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(MID)
    c.drawString(MARGIN + 12, y, "ICD-10")
    c.drawString(MARGIN + 68, y, "DIAGNOSIS")
    c.drawString(MARGIN + 320, y, "ONSET")
    c.drawString(MARGIN + 400, y, "STATUS")
    y -= 4
    c.setStrokeColor(RULE_COLOR)
    c.line(MARGIN + 8, y, MARGIN + INNER_W - 8, y)
    y -= 10

    c.setFont("Helvetica", 7)
    c.setFillColor(DARK)
    for code, dx, onset, status in problems:
        c.setFont("Helvetica-Bold", 7)
        c.drawString(MARGIN + 12, y, code)
        c.setFont("Helvetica", 7)
        c.drawString(MARGIN + 68, y, dx)
        c.drawString(MARGIN + 320, y, onset)
        c.drawString(MARGIN + 400, y, status)
        y -= 12

    y -= 6

    # ── Allergy / Social / Family History (compact) ───────────────────────────
    c.setFillColor(SECTION_BG)
    c.roundRect(MARGIN + 4, y - 16, INNER_W - 8, 16, 2, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(MARGIN + 12, y - 12, "ALLERGIES / SOCIAL / FAMILY HISTORY")
    y -= 26

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(MARGIN + 12, y, "Allergies:")
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN + 62, y, "No known drug allergies (NKDA)")
    y -= 11

    c.setFont("Helvetica-Bold", 7)
    c.drawString(MARGIN + 12, y, "Tobacco:")
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN + 55, y, "Former smoker — quit 2017 (~7 years prior). 1/2 PPD x 15 years.")
    y -= 11

    c.setFont("Helvetica-Bold", 7)
    c.drawString(MARGIN + 12, y, "Alcohol:")
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN + 55, y, "Social — 1-2 drinks/week. No history of abuse.")
    y -= 11

    c.setFont("Helvetica-Bold", 7)
    c.drawString(MARGIN + 12, y, "Family Hx:")
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN + 62, y, "Father deceased (MI at 62, CAD, HTN). Mother living (age 83, DM2). Brother (55, HTN).")
    y -= 11

    c.setFont("Helvetica-Bold", 7)
    c.drawString(MARGIN + 12, y, "Occupation:")
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN + 68, y, "Financial analyst. Married to Sarah Smith. Two adult children.")
    y -= 16

    draw_footer(c, page_num)
    c.showPage()

    # ═══════════════════════════════════════════════════════════════════════════
    # PAGE 6: Final encounter (death) + records attestation
    # ═══════════════════════════════════════════════════════════════════════════

    page_num = 6
    y = HEIGHT - MARGIN

    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.rect(MARGIN - 4, MARGIN - 4, INNER_W + 8, HEIGHT - 2 * MARGIN + 8)

    y = draw_page_header(c, y, page_num, total_pages)

    # ── Final encounter: Death ─────────────────────────────────────────────────
    y = draw_encounter(c, y,
                       "March 3, 2026",
                       "EMERGENCY DEPARTMENT — NORTHWESTERN MEMORIAL HOSPITAL",
                       "Rachel Nguyen, MD (Emergency Medicine)",
                       [
                           "**NOTIFICATION RECEIVED FROM NORTHWESTERN MEMORIAL HOSPITAL ER:**",
                           "",
                           "Patient John Michael Smith (DOB 04/15/1968) presented to Northwestern",
                           "Memorial Hospital Emergency Department on March 3, 2026 at approximately",
                           "13:45 via EMS with acute onset severe chest pain and diaphoresis.",
                           "",
                           "**ED COURSE PER HOSPITAL RECORDS:**",
                           "Arrived in acute distress. ECG showed ST-elevation in leads II, III, aVF,",
                           "V5-V6 consistent with acute STEMI (ST-elevation myocardial infarction).",
                           "Patient became hemodynamically unstable with cardiogenic shock.",
                           "Emergent cardiac catheterization was initiated.",
                           "",
                           "Patient went into cardiac arrest (ventricular fibrillation) en route to",
                           "the cardiac catheterization lab. ACLS protocol initiated. Resuscitation",
                           "efforts continued for 35 minutes without return of spontaneous circulation.",
                           "",
                           "**TIME OF DEATH: 14:23 CST**",
                           "",
                           "**CAUSE OF DEATH (per death certificate):**",
                           "  a. Acute myocardial infarction (STEMI)",
                           "  b. Coronary artery disease",
                           "  c. Hypertension",
                           "",
                           "**MANNER OF DEATH: Natural**",
                       ],
                       vitals="BP 82/54 (on arrival)  |  HR 124 (irregular)  |  SpO2 88%  |  Temp 97.8F",
                       assessment=[
                           "1. Acute ST-elevation myocardial infarction (I21.3)",
                           "2. Cardiogenic shock (R57.0)",
                           "3. Cardiac arrest — ventricular fibrillation (I46.0)",
                           "4. Death (R99)",
                       ])

    # ── Records Attestation ────────────────────────────────────────────────────
    y -= 12
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1)
    c.rect(MARGIN + 4, y - 90, INNER_W - 8, 90, fill=0, stroke=1)

    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN + 14, y - 16, "RECORDS ATTESTATION")

    attest = [
        "I hereby certify that the foregoing is a true and complete copy of the medical records",
        "maintained by Lakeview Internal Medicine for patient John Michael Smith (MRN: LIM-2019-04471)",
        "for the date range January 2019 through March 2026. These records were prepared in the",
        "ordinary course of medical practice and are maintained in accordance with applicable state",
        "and federal regulations.",
    ]

    c.setFillColor(MID)
    c.setFont("Helvetica", 7)
    attest_y = y - 30
    for line in attest:
        c.drawString(MARGIN + 14, attest_y, line)
        attest_y -= 10

    # Signature
    sig_y = y - 90 + 12
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(MARGIN + 14, sig_y + 8, MARGIN + 200, sig_y + 8)
    c.setFillColor(HexColor("#1a3366"))
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(MARGIN + 20, sig_y + 11, "S. Chen, MD")

    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 6)
    c.drawString(MARGIN + 14, sig_y, "Sarah Chen, MD — Primary Care Physician")
    c.drawString(MARGIN + 300, sig_y, "Date: March 5, 2026")

    draw_footer(c, page_num)

    # ── Watermark on all pages ─────────────────────────────────────────────────
    # Note: Only applies to last page since we already called showPage for others
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
