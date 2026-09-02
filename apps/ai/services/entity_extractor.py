"""Extract structured entities from resume text: contact info, experience, education, etc."""

import re
from typing import Optional
from datetime import datetime


def extract_contact_info(text: str) -> dict:
    """Extract contact information from resume text."""
    result: dict[str, Optional[str]] = {
        "first_name": None,
        "last_name": None,
        "email": None,
        "phone": None,
        "location": None,
        "linkedin": None,
        "portfolio": None,
    }

    # Email
    email_match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    if email_match:
        result["email"] = email_match.group(0).lower()

    # Phone
    phone_match = re.search(
        r"(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}",
        text
    )
    if phone_match:
        result["phone"] = phone_match.group(0).strip()

    # LinkedIn
    linkedin_match = re.search(
        r"linkedin\.com/in/([a-zA-Z0-9_-]+)",
        text, re.IGNORECASE
    )
    if linkedin_match:
        result["linkedin"] = f"https://linkedin.com/in/{linkedin_match.group(1)}"

    # Portfolio/GitHub
    portfolio_match = re.search(
        r"(github\.com/[a-zA-Z0-9_-]+|https?://[a-zA-Z0-9_-]+\.[a-zA-Z]{2,})",
        text, re.IGNORECASE
    )
    if portfolio_match:
        result["portfolio"] = portfolio_match.group(0)
        if not result["portfolio"].startswith("http"):
            result["portfolio"] = f"https://{result['portfolio']}"

    # Name (first non-empty line that looks like a name)
    lines = text.split("\n")
    for line in lines[:10]:
        stripped = line.strip()
        if not stripped or len(stripped) > 60:
            continue
        # Skip lines that look like section headers or contact info
        if any(kw in stripped.lower() for kw in ["@", "phone", "email", "tel", "summary", "objective", "resume", "cv"]):
            continue
        # Must be 2-4 words, each starting with capital letter
        words = stripped.split()
        if 2 <= len(words) <= 4 and all(
            w[0].isupper() and w[0].isalpha() for w in words if len(w) > 1
        ):
            result["first_name"] = words[0]
            result["last_name"] = " ".join(words[1:])
            break

    # Location (city, state pattern)
    location_match = re.search(
        r"([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)",
        text[:500]
    )
    if location_match:
        result["location"] = location_match.group(0)

    return result


def parse_date(date_str: str) -> Optional[str]:
    """Try to parse a date string into ISO format."""
    date_str = date_str.strip().rstrip(".")
    date_str = re.sub(r"(st|nd|rd|th)", "", date_str)

    formats = [
        "%B %Y", "%b %Y", "%m/%Y", "%Y", "%m-%Y",
        "%B %d, %Y", "%b %d, %Y", "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date().isoformat()
        except ValueError:
            continue
    # If only year
    year_match = re.search(r"(19|20)\d{2}", date_str)
    if year_match:
        return f"{year_match.group(0)}-01-01"
    return None


def extract_experience(text: str) -> list[dict]:
    """Extract work experience entries from a section."""
    entries = []

    # Split by common patterns that indicate new job entries
    # Look for date ranges that mark the beginning of an entry
    date_range_pattern = re.compile(
        r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}|(?:\d{1,2}/\d{4})|(?:\d{4}))\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}|(?:\d{1,2}/\d{4})|(?:\d{4})|Present|Current)",
        re.IGNORECASE
    )

    matches = list(date_range_pattern.finditer(text))

    for i, match in enumerate(matches):
        start = max(0, match.start() - 200)
        context = text[start:match.end() + 200]
        lines = context.split("\n")

        # Find title and company from lines before the date
        title = ""
        company = ""
        description_parts = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            if date_range_pattern.search(stripped):
                continue
            if not title and len(stripped) < 100:
                # Heuristic: line before date that's not too long is likely title or company
                if not company:
                    company = stripped.rstrip(",·•")
                else:
                    title = stripped.rstrip(",·•")
            elif title and not description_parts:
                pass  # Start collecting description after title
            if stripped and stripped != title and stripped != company:
                if any(w in stripped.lower() for w in ["developed", "built", "led", "managed", "implemented", "designed", "created", "improved", "increased", "reduced", "delivered", "achieved", "responsible", "•", "-", "·"]):
                    description_parts.append(stripped)

        if company:
            start_date = parse_date(match.group(1))
            end_text = match.group(2)
            is_current = end_text.lower() in ("present", "current")
            end_date = None if is_current else parse_date(end_text)

            entries.append({
                "company": company[:200],
                "title": title[:200] if title else "Unknown Title",
                "description": "\n".join(description_parts[:10])[:2000] if description_parts else None,
                "start_date": start_date,
                "end_date": end_date,
                "is_current": is_current,
                "location": None,
            })

    return entries


def extract_education(text: str) -> list[dict]:
    """Extract education entries from a section."""
    entries = []

    degree_pattern = re.compile(
        r"(Bachelor|Master|Ph\.?D|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|Associate|Diploma|B\.?Tech|M\.?Tech|BCA|MCA|B\.?Eng|M\.?Eng)\w*",
        re.IGNORECASE
    )

    # Split by lines and look for degree patterns
    lines = text.split("\n")
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        degree_match = degree_pattern.search(stripped)
        if degree_match:
            # Try to extract institution and field
            parts = re.split(r"[,|–—]", stripped)
            institution = ""
            degree = degree_match.group(0)
            field = ""

            for part in parts:
                part = part.strip()
                if degree_pattern.search(part):
                    degree = part.strip()
                elif not institution and len(part) > 3:
                    institution = part

            # Extract year if present
            year_match = re.search(r"(19|20)\d{2}", stripped)
            end_date = None
            if year_match:
                end_date = f"{year_match.group(0)}-01-01"

            if institution:
                entries.append({
                    "institution": institution[:200],
                    "degree": degree[:200] if degree else None,
                    "field": field[:200] if field else None,
                    "start_date": None,
                    "end_date": end_date,
                    "gpa": None,
                    "description": None,
                })

    return entries


def extract_projects(text: str) -> list[dict]:
    """Extract project entries from a section."""
    entries = []

    # Split by bullet points or numbered items
    items = re.split(r"(?:^|\n)\s*(?:•|\-|\*|\d+\.)\s*", text)

    for item in items:
        item = item.strip()
        if not item or len(item) < 10:
            continue

        lines = item.split("\n")
        name = lines[0].strip()[:200]
        description = "\n".join(lines[1:]).strip()[:2000] if len(lines) > 1 else None

        # Extract technologies if mentioned
        tech_pattern = re.compile(
            r"(?:built|using|with|technologies?|tech\s*stack)[:\s]+(.+)",
            re.IGNORECASE
        )
        tech_match = tech_pattern.search(item)
        technologies = []
        if tech_match:
            technologies = [t.strip() for t in re.split(r"[,|/&]", tech_match.group(1)) if t.strip()]

        entries.append({
            "name": name,
            "description": description,
            "url": None,
            "technologies": technologies[:20],
            "start_date": None,
            "end_date": None,
        })

    return entries


def extract_certifications(text: str) -> list[dict]:
    """Extract certification entries from a section."""
    entries = []

    lines = text.split("\n")
    for line in lines:
        stripped = line.strip()
        if not stripped or len(stripped) < 5:
            continue

        # Clean bullet points
        cleaned = re.sub(r"^[•\-\*]\s*", "", stripped)
        if cleaned:
            # Try to extract issuer
            issuer = None
            issuer_match = re.search(r"[-–—]\s*(.+)$", cleaned)
            if issuer_match:
                issuer = issuer_match.group(1).strip()[:200]

            entries.append({
                "name": cleaned[:200].rstrip(","),
                "issuer": issuer,
                "issue_date": None,
                "expiry_date": None,
                "credential_id": None,
            })

    return entries
