"""TalentIQ AI Service — Resume parsing, skill extraction, and embedding generation."""

import os
import time
import logging
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

from schemas.resume import ResumeParseRequest, ResumeParseResponse
from services.text_extractor import extract_text
from services.section_detector import detect_sections, detect_section_names
from services.entity_extractor import (
    extract_contact_info, extract_experience, extract_education,
    extract_projects, extract_certifications,
)
from services.skill_extractor import extract_skills
from services.profile_builder import build_profile
from services.embedding_service import generate_candidate_embedding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("talentiq-ai")

app = FastAPI(
    title="TalentIQ AI Service",
    description="Resume intelligence engine — parsing, extraction, and embeddings",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_api_key(authorization: Optional[str] = Header(None)):
    """Verify the API key from the Node.js service."""
    expected = os.getenv("AI_SERVICE_API_KEY", "dev-api-key")
    if authorization:
        token = authorization.replace("Bearer ", "")
        if token == expected:
            return True
    # In development, allow all requests
    if os.getenv("ENVIRONMENT", "development") == "development":
        return True
    raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "talentiq-ai",
        "version": "1.0.0",
        "capabilities": [
            "resume_parsing",
            "skill_extraction",
            "entity_extraction",
            "embedding_generation",
        ],
    }


@app.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(
    request: ResumeParseRequest,
    authorization: Optional[str] = Header(None),
):
    """Parse resume text and extract structured candidate profile.

    Validates all AI output through Pydantic schemas before returning.
    """
    verify_api_key(authorization)
    start_time = time.time()

    try:
        text = request.text
        logger.info(f"Parsing resume: {len(text)} chars, type={request.file_type}")

        # Step 1: Detect sections
        sections = detect_sections(text)
        section_names = list(sections.keys())
        logger.info(f"Sections detected: {section_names}")

        # Step 2: Extract contact info
        contact_info = extract_contact_info(text)
        logger.info(f"Contact: name={contact_info.get('first_name')} {contact_info.get('last_name')}, email={contact_info.get('email')}")

        # Step 3: Extract skills
        skills_section = sections.get("skills", "")
        skills = extract_skills(text, skills_section)
        logger.info(f"Skills found: {len(skills)}")

        # Step 4: Extract experience
        experience_section = sections.get("experience", "")
        experience = extract_experience(experience_section) if experience_section else extract_experience(text)
        logger.info(f"Experience entries: {len(experience)}")

        # Step 5: Extract education
        education_section = sections.get("education", "")
        education = extract_education(education_section) if education_section else []
        logger.info(f"Education entries: {len(education)}")

        # Step 6: Extract projects
        projects_section = sections.get("projects", "")
        projects = extract_projects(projects_section) if projects_section else []
        logger.info(f"Project entries: {len(projects)}")

        # Step 7: Extract certifications
        certs_section = sections.get("certifications", "")
        certifications = extract_certifications(certs_section) if certs_section else []
        logger.info(f"Certification entries: {len(certifications)}")

        # Step 8: Build and validate profile
        response = build_profile(
            text=text,
            file_type=request.file_type,
            skills=skills,
            experience=experience,
            education=education,
            projects=projects,
            certifications=certifications,
            contact_info=contact_info,
            sections_detected=section_names,
        )

        elapsed = (time.time() - start_time) * 1000
        logger.info(f"Parsed in {elapsed:.0f}ms — confidence={response.profile.overall_confidence}")

        return response

    except Exception as e:
        logger.error(f"Resume parsing failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")


@app.post("/parse-file", response_model=ResumeParseResponse)
async def parse_resume_file(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
):
    """Parse an uploaded resume file (PDF, DOCX, TXT, image).

    Extracts text from the file, then runs the full parsing pipeline.
    """
    verify_api_key(authorization)

    # Validate file type
    allowed_types = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "text/plain": "txt",
        "image/png": "image",
        "image/jpeg": "image",
        "image/jpg": "image",
    }

    file_type = allowed_types.get(file.content_type)
    if not file_type:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, DOCX, TXT, PNG, JPG"
        )

    # Read file
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Extract text
    try:
        text = extract_text(content, file_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Parse extracted text
    request = ResumeParseRequest(text=text, file_type=file_type)
    return await parse_resume(request, authorization)


@app.post("/embedding")
async def generate_embedding_endpoint(
    text: str,
    authorization: Optional[str] = Header(None),
):
    """Generate an embedding vector for semantic search."""
    verify_api_key(authorization)

    if not text or len(text) < 5:
        raise HTTPException(status_code=400, detail="Text too short for embedding")

    embedding = generate_candidate_embedding(text)
    return {
        "embedding": embedding,
        "dimensions": len(embedding),
        "model": "tfidf-hash-local",
    }


@app.get("/capabilities")
async def capabilities():
    """List AI service capabilities."""
    return {
        "parsing": {
            "pdf": True,
            "docx": True,
            "txt": True,
            "image": False,  # Requires pytesseract
        },
        "extraction": {
            "contact_info": True,
            "skills": True,
            "experience": True,
            "education": True,
            "projects": True,
            "certifications": True,
        },
        "embedding": {
            "model": "tfidf-hash",
            "dimensions": 512,
            "available": True,
        },
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", "3002"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
