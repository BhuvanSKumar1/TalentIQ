"""Pydantic schemas for resume parsing — used to validate ALL AI output."""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from enum import Enum


class SkillProficiency(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class ExtractedSkill(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    proficiency: SkillProficiency = SkillProficiency.INTERMEDIATE
    years_of_experience: Optional[float] = Field(None, ge=0, le=50)
    confidence: float = Field(0.8, ge=0.0, le=1.0)
    evidence: Optional[str] = None
    category: Optional[str] = None


class ExtractedExperience(BaseModel):
    company: str = Field(..., min_length=1, max_length=200)
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    location: Optional[str] = None


class ExtractedEducation(BaseModel):
    institution: str = Field(..., min_length=1, max_length=200)
    degree: Optional[str] = None
    field: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    description: Optional[str] = None


class ExtractedProject(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    url: Optional[str] = None
    technologies: list[str] = []
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ExtractedCertification(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    issuer: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None


class ExtractedProfile(BaseModel):
    """Structured profile output from resume parsing — validated before storage."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    summary: Optional[str] = None

    skills: list[ExtractedSkill] = []
    experience: list[ExtractedExperience] = []
    education: list[ExtractedEducation] = []
    projects: list[ExtractedProject] = []
    certifications: list[ExtractedCertification] = []

    overall_confidence: float = Field(0.8, ge=0.0, le=1.0)
    processing_notes: list[str] = []


class ResumeParseRequest(BaseModel):
    """Request to parse resume text."""
    text: str = Field(..., min_length=10, max_length=100000)
    file_type: str = Field(..., pattern=r"^(pdf|docx|txt|image)$")


class ResumeParseResponse(BaseModel):
    """Response from resume parsing."""
    profile: ExtractedProfile
    raw_text_length: int
    sections_detected: list[str] = []
    processing_time_ms: float
