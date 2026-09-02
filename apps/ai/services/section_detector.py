"""Detect resume sections from raw text using heuristic pattern matching."""

import re
from typing import Optional


# Common section headers in resumes
SECTION_PATTERNS = {
    "contact": re.compile(
        r"(contact|personal\s+(info|information|details))",
        re.IGNORECASE
    ),
    "summary": re.compile(
        r"(summary|objective|profile|about|overview|professional\s+summary|career\s+summary)",
        re.IGNORECASE
    ),
    "experience": re.compile(
        r"(experience|work\s+history|employment|professional\s+experience|work\s+experience|career\s+history)",
        re.IGNORECASE
    ),
    "education": re.compile(
        r"(education|academic|qualification|degrees?)",
        re.IGNORECASE
    ),
    "skills": re.compile(
        r"(skills|technical\s+skills|competencies|technologies|proficiencies|tech\s+stack)",
        re.IGNORECASE
    ),
    "projects": re.compile(
        r"(projects?|portfolio|personal\s+projects?|side\s+projects?|key\s+projects?)",
        re.IGNORECASE
    ),
    "certifications": re.compile(
        r"(certifications?|certificates?|licenses?|credentials?)",
        re.IGNORECASE
    ),
    "awards": re.compile(
        r"(awards?|honors?|achievements?|recognition)",
        re.IGNORECASE
    ),
    "publications": re.compile(
        r"(publications?|papers?|articles?)",
        re.IGNORECASE
    ),
    "languages": re.compile(
        r"(languages?)",
        re.IGNORECASE
    ),
}


def detect_sections(text: str) -> dict[str, str]:
    """Detect and extract resume sections from raw text.

    Returns a dict mapping section name to its content.
    """
    lines = text.split("\n")
    sections: dict[str, str] = {}
    current_section: Optional[str] = None
    current_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_section:
                current_lines.append("")
            continue

        # Check if this line is a section header
        is_header = False
        for section_name, pattern in SECTION_PATTERNS.items():
            # Section headers are typically short, standalone lines
            if len(stripped) < 60 and pattern.match(stripped):
                # Save previous section
                if current_section:
                    sections[current_section] = "\n".join(current_lines).strip()
                current_section = section_name
                current_lines = []
                is_header = True
                break

        if not is_header and current_section:
            current_lines.append(stripped)

    # Save last section
    if current_section:
        sections[current_section] = "\n".join(current_lines).strip()

    return sections


def detect_section_names(text: str) -> list[str]:
    """Return just the names of detected sections."""
    return list(detect_sections(text).keys())
