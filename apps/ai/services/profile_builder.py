"""Build a validated structured candidate profile from extracted resume data."""

import time
from typing import Optional
from schemas.resume import (
    ExtractedProfile, ExtractedSkill, ExtractedExperience,
    ExtractedEducation, ExtractedProject, ExtractedCertification,
    ResumeParseRequest, ResumeParseResponse, SkillProficiency,
)


def build_profile(
    text: str,
    file_type: str,
    skills: list[dict],
    experience: list[dict],
    education: list[dict],
    projects: list[dict],
    certifications: list[dict],
    contact_info: dict,
    sections_detected: list[str],
) -> ResumeParseResponse:
    """Assemble and validate a complete resume parse response.

    This function takes raw extraction results, validates them through Pydantic,
    and returns a fully validated ResumeParseResponse.
    """
    start_time = time.time()

    processing_notes: list[str] = []

    # Determine overall confidence based on completeness
    confidence_factors = []
    if contact_info.get("first_name") and contact_info.get("last_name"):
        confidence_factors.append(0.95)
    else:
        confidence_factors.append(0.3)
        processing_notes.append("Could not extract name — check resume format")

    if contact_info.get("email"):
        confidence_factors.append(0.9)
    else:
        confidence_factors.append(0.5)
        processing_notes.append("Email not found")

    if skills:
        avg_skill_conf = sum(s.get("confidence", 0.5) for s in skills) / len(skills)
        confidence_factors.append(avg_skill_conf)
    else:
        confidence_factors.append(0.2)
        processing_notes.append("No skills detected")

    if experience:
        confidence_factors.append(0.9)
    else:
        confidence_factors.append(0.4)
        processing_notes.append("No work experience detected")

    if education:
        confidence_factors.append(0.85)
    else:
        confidence_factors.append(0.6)
        processing_notes.append("No education detected")

    overall_confidence = sum(confidence_factors) / len(confidence_factors) if confidence_factors else 0.5

    # Build validated profile
    profile_data = {
        "first_name": contact_info.get("first_name") or "Unknown",
        "last_name": contact_info.get("last_name") or "Candidate",
        "email": contact_info.get("email"),
        "phone": contact_info.get("phone"),
        "location": contact_info.get("location"),
        "linkedin": contact_info.get("linkedin"),
        "portfolio": contact_info.get("portfolio"),
        "summary": None,  # Will be set from summary section if available
        "skills": [],
        "experience": [],
        "education": [],
        "projects": [],
        "certifications": [],
        "overall_confidence": round(overall_confidence, 3),
        "processing_notes": processing_notes,
    }

    # Extract summary if available
    for section_name in ["summary", "objective", "profile"]:
        # Summary would have been detected by section_detector
        pass

    # Validate skills
    validated_skills = []
    for skill_data in skills:
        try:
            # Map proficiency string
            prof_str = skill_data.get("proficiency", "INTERMEDIATE").upper()
            if prof_str not in SkillProficiency.__members__:
                prof_str = "INTERMEDIATE"

            skill = ExtractedSkill(
                name=skill_data["name"][:100],
                proficiency=SkillProficiency(prof_str),
                years_of_experience=skill_data.get("years_of_experience"),
                confidence=round(skill_data.get("confidence", 0.8), 3),
                evidence=skill_data.get("evidence", "")[:500] if skill_data.get("evidence") else None,
                category=skill_data.get("category"),
            )
            validated_skills.append(skill)
        except Exception as e:
            processing_notes.append(f"Skill '{skill_data.get('name', 'unknown')}' validation failed: {str(e)}")

    profile_data["skills"] = validated_skills

    # Validate experience
    validated_experience = []
    for exp_data in experience:
        try:
            exp = ExtractedExperience(
                company=exp_data["company"][:200],
                title=exp_data["title"][:200],
                description=exp_data.get("description", "")[:2000] if exp_data.get("description") else None,
                start_date=exp_data.get("start_date"),
                end_date=exp_data.get("end_date"),
                is_current=exp_data.get("is_current", False),
                location=exp_data.get("location"),
            )
            validated_experience.append(exp)
        except Exception as e:
            processing_notes.append(f"Experience entry validation failed: {str(e)}")

    profile_data["experience"] = validated_experience

    # Validate education
    validated_education = []
    for edu_data in education:
        try:
            edu = ExtractedEducation(
                institution=edu_data["institution"][:200],
                degree=edu_data.get("degree", "")[:200] if edu_data.get("degree") else None,
                field=edu_data.get("field", "")[:200] if edu_data.get("field") else None,
                start_date=edu_data.get("start_date"),
                end_date=edu_data.get("end_date"),
                gpa=edu_data.get("gpa"),
                description=edu_data.get("description", "")[:2000] if edu_data.get("description") else None,
            )
            validated_education.append(edu)
        except Exception as e:
            processing_notes.append(f"Education entry validation failed: {str(e)}")

    profile_data["education"] = validated_education

    # Validate projects
    validated_projects = []
    for proj_data in projects:
        try:
            proj = ExtractedProject(
                name=proj_data["name"][:200],
                description=proj_data.get("description", "")[:2000] if proj_data.get("description") else None,
                url=proj_data.get("url"),
                technologies=proj_data.get("technologies", [])[:20],
                start_date=proj_data.get("start_date"),
                end_date=proj_data.get("end_date"),
            )
            validated_projects.append(proj)
        except Exception as e:
            processing_notes.append(f"Project entry validation failed: {str(e)}")

    profile_data["projects"] = validated_projects

    # Validate certifications
    validated_certs = []
    for cert_data in certifications:
        try:
            cert = ExtractedCertification(
                name=cert_data["name"][:200],
                issuer=cert_data.get("issuer", "")[:200] if cert_data.get("issuer") else None,
                issue_date=cert_data.get("issue_date"),
                expiry_date=cert_data.get("expiry_date"),
                credential_id=cert_data.get("credential_id"),
            )
            validated_certs.append(cert)
        except Exception as e:
            processing_notes.append(f"Certification entry validation failed: {str(e)}")

    profile_data["certifications"] = validated_certs

    # Build final validated profile
    profile = ExtractedProfile(**profile_data)

    elapsed_ms = (time.time() - start_time) * 1000

    return ResumeParseResponse(
        profile=profile,
        raw_text_length=len(text),
        sections_detected=sections_detected,
        processing_time_ms=round(elapsed_ms, 2),
    )
