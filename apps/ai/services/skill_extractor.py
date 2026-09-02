"""Skill extraction from resume text using a comprehensive skills dictionary and context analysis."""

import re
from typing import Optional


# Comprehensive skills dictionary organized by category
SKILLS_DATABASE: dict[str, dict] = {
    # Programming Languages
    "python": {"category": "Programming Languages", "aliases": ["py", "python3", "python2"]},
    "javascript": {"category": "Programming Languages", "aliases": ["js", "es6", "es2015", "es2020", "ecmascript"]},
    "typescript": {"category": "Programming Languages", "aliases": ["ts"]},
    "java": {"category": "Programming Languages", "aliases": ["jdk", "jvm"]},
    "c++": {"category": "Programming Languages", "aliases": ["cpp", "c plus plus"]},
    "c#": {"category": "Programming Languages", "aliases": ["csharp", "c sharp", "dotnet"]},
    "go": {"category": "Programming Languages", "aliases": ["golang"]},
    "rust": {"category": "Programming Languages", "aliases": []},
    "ruby": {"category": "Programming Languages", "aliases": ["rails", "ruby on rails", "ror"]},
    "php": {"category": "Programming Languages", "aliases": ["laravel"]},
    "swift": {"category": "Programming Languages", "aliases": ["ios"]},
    "kotlin": {"category": "Programming Languages", "aliases": ["android"]},
    "scala": {"category": "Programming Languages", "aliases": []},
    "r": {"category": "Programming Languages", "aliases": ["r programming", "rstudio"]},
    "sql": {"category": "Programming Languages", "aliases": ["mysql", "plsql", "t-sql"]},
    "html": {"category": "Frontend", "aliases": ["html5"]},
    "css": {"category": "Frontend", "aliases": ["css3", "scss", "sass", "less", "tailwind css", "tailwind"]},

    # Frontend Frameworks
    "react": {"category": "Frontend Frameworks", "aliases": ["reactjs", "react.js", "react native"]},
    "vue": {"category": "Frontend Frameworks", "aliases": ["vuejs", "vue.js", "vue3", "vue2", "nuxt", "nuxtjs"]},
    "angular": {"category": "Frontend Frameworks", "aliases": ["angularjs", "angular 2+", "ng"]},
    "svelte": {"category": "Frontend Frameworks", "aliases": ["sveltekit", "svelte js"]},
    "next.js": {"category": "Frontend Frameworks", "aliases": ["nextjs", "next"]},
    "ember": {"category": "Frontend Frameworks", "aliases": ["emberjs", "ember.js"]},

    # Backend Frameworks
    "node.js": {"category": "Backend Frameworks", "aliases": ["nodejs", "node", "express", "express.js", "nest", "nestjs"]},
    "spring boot": {"category": "Backend Frameworks", "aliases": ["spring", "spring framework", "spring mvc"]},
    "django": {"category": "Backend Frameworks", "aliases": ["python django"]},
    "flask": {"category": "Backend Frameworks", "aliases": ["python flask"]},
    "fastapi": {"category": "Backend Frameworks", "aliases": ["fast api", "fast-api"]},
    "ruby on rails": {"category": "Backend Frameworks", "aliases": ["rails"]},
    "laravel": {"category": "Backend Frameworks", "aliases": ["php laravel"]},
    "asp.net": {"category": "Backend Frameworks", "aliases": ["dotnet", ".net", ".net core", "aspnet", "blazor"]},
    "graphql": {"category": "Backend Frameworks", "aliases": ["gql", "apollo", "relay"]},
    "rest api": {"category": "Backend Frameworks", "aliases": ["rest", "restful", "rest apis", "restful api"]},

    # Databases
    "postgresql": {"category": "Databases", "aliases": ["postgres", "psql"]},
    "mysql": {"category": "Databases", "aliases": []},
    "mongodb": {"category": "Databases", "aliases": ["mongo", "mongo db"]},
    "redis": {"category": "Databases", "aliases": []},
    "elasticsearch": {"category": "Databases", "aliases": ["elastic", "es", "opensearch"]},
    "dynamodb": {"category": "Databases", "aliases": ["dynamo"]},
    "cassandra": {"category": "Databases", "aliases": []},
    "neo4j": {"category": "Databases", "aliases": ["neo4j graph"]},
    "sqlite": {"category": "Databases", "aliases": ["sql lite"]},
    "mssql": {"category": "Databases", "aliases": ["sql server", "microsoft sql server"]},
    "oracle": {"category": "Databases", "aliases": ["oracle db"]},

    # Cloud & DevOps
    "aws": {"category": "Cloud & DevOps", "aliases": ["amazon web services", "ec2", "s3", "lambda", "aws lambda", "ecs", "eks", "rds"]},
    "google cloud": {"category": "Cloud & DevOps", "aliases": ["gcp", "google cloud platform", "cloud run", "bigquery"]},
    "azure": {"category": "Cloud & DevOps", "aliases": ["microsoft azure", "azure devops"]},
    "docker": {"category": "Cloud & DevOps", "aliases": ["dockerfile", "docker-compose"]},
    "kubernetes": {"category": "Cloud & DevOps", "aliases": ["k8s", "kubectl"]},
    "terraform": {"category": "Cloud & DevOps", "aliases": ["tf", "infrastructure as code", "iac"]},
    "ansible": {"category": "Cloud & DevOps", "aliases": []},
    "jenkins": {"category": "Cloud & DevOps", "aliases": ["ci/cd", "continuous integration", "continuous deployment"]},
    "github actions": {"category": "Cloud & DevOps", "aliases": ["gh actions", "github ci"]},
    "circleci": {"category": "Cloud & DevOps", "aliases": ["circle ci"]},
    "gitlab ci": {"category": "Cloud & DevOps", "aliases": ["gitlab ci/cd", "gitlab pipelines"]},
    "nginx": {"category": "Cloud & DevOps", "aliases": ["reverse proxy"]},
    "linux": {"category": "Cloud & DevOps", "aliases": ["ubuntu", "centos", "debian", "redhat"]},
    "prometheus": {"category": "Cloud & DevOps", "aliases": []},
    "grafana": {"category": "Cloud & DevOps", "aliases": []},

    # AI/ML
    "machine learning": {"category": "AI & ML", "aliases": ["ml", "machine-learning"]},
    "deep learning": {"category": "AI & ML", "aliases": ["dl", "neural networks"]},
    "pytorch": {"category": "AI & ML", "aliases": ["py torch"]},
    "tensorflow": {"category": "AI & ML", "aliases": ["tf", "keras"]},
    "nlp": {"category": "AI & ML", "aliases": ["natural language processing", "nlp"]},
    "computer vision": {"category": "AI & ML", "aliases": ["cv", "image processing"]},
    "transformers": {"category": "AI & ML", "aliases": ["bert", "gpt", "llm", "large language models", "langchain", "rag", "retrieval augmented generation"]},
    "scikit-learn": {"category": "AI & ML", "aliases": ["sklearn", "scikit learn"]},
    "pandas": {"category": "AI & ML", "aliases": ["data analysis"]},
    "numpy": {"category": "AI & ML", "aliases": ["numerical computing"]},
    "matplotlib": {"category": "AI & ML", "aliases": ["data visualization"]},
    "opencv": {"category": "AI & ML", "aliases": ["open cv"]},
    "hugging face": {"category": "AI & ML", "aliases": ["huggingface", "hugging face transformers"]},

    # Soft Skills
    "communication": {"category": "Soft Skills", "aliases": ["verbal communication", "written communication", "public speaking"]},
    "leadership": {"category": "Soft Skills", "aliases": ["team lead", "technical lead", "team leadership"]},
    "problem solving": {"category": "Soft Skills", "aliases": ["analytical thinking", "critical thinking", "problem-solving"]},
    "teamwork": {"category": "Soft Skills", "aliases": ["collaboration", "cross-functional", "team player"]},
    "agile": {"category": "Soft Skills", "aliases": ["scrum", "kanban", "sprint", "agile methodology"]},
    "project management": {"category": "Soft Skills", "aliases": ["pm", "jira", "confluence", "product management"]},
    "mentoring": {"category": "Soft Skills", "aliases": ["coaching", "training"]},

    # Testing
    "jest": {"category": "Testing", "aliases": ["jestjs"]},
    "pytest": {"category": "Testing", "aliases": ["py test"]},
    "cypress": {"category": "Testing", "aliases": ["e2e testing", "end to end"]},
    "selenium": {"category": "Testing", "aliases": ["webdriver"]},
    "mocha": {"category": "Testing", "aliases": ["chai"]},
    "junit": {"category": "Testing", "aliases": ["java unit testing"]},
    "tdd": {"category": "Testing", "aliases": ["test driven development", "test-driven development"]},

    # Data
    "apache spark": {"category": "Data Engineering", "aliases": ["spark", "pyspark"]},
    "kafka": {"category": "Data Engineering", "aliases": ["apache kafka", "message queue"]},
    "airflow": {"category": "Data Engineering", "aliases": ["apache airflow"]},
    "hadoop": {"category": "Data Engineering", "aliases": ["hdfs"]},
    "tableau": {"category": "Data Engineering", "aliases": ["data visualization"]},
    "power bi": {"category": "Data Engineering", "aliases": ["microsoft power bi"]},
}

# Reverse lookup: alias -> canonical name
_ALIAS_MAP: dict[str, str] = {}
for canonical, info in SKILLS_DATABASE.items():
    _ALIAS_MAP[canonical.lower()] = canonical
    for alias in info["aliases"]:
        _ALIAS_MAP[alias.lower()] = canonical


def extract_skills(text: str, section_text: Optional[str] = None) -> list[dict]:
    """Extract skills from resume text with confidence scores.

    Args:
        text: Full resume text (for context-based confidence)
        section_text: Optional skills section text (higher confidence)

    Returns:
        List of extracted skills with proficiency, confidence, and evidence.
    """
    search_text = (section_text or text).lower()
    full_text = text.lower()
    found_skills: dict[str, dict] = {}

    for skill_key, info in SKILLS_DATABASE.items():
        # Check canonical name first
        if skill_key.lower() in search_text:
            confidence = 0.9 if section_text and skill_key.lower() in (section_text or "").lower() else 0.8
            found_skills[skill_key] = _build_skill_entry(
                skill_key, info["category"], confidence, full_text
            )
        else:
            # Check aliases
            for alias in info["aliases"]:
                if alias.lower() in search_text:
                    confidence = 0.85 if section_text else 0.75
                    found_skills[skill_key] = _build_skill_entry(
                        skill_key, info["category"], confidence, full_text
                    )
                    break

    # Infer proficiency from context
    for skill_name, entry in found_skills.items():
        entry["proficiency"] = _infer_proficiency(skill_name, full_text)

    return list(found_skills.values())


def _build_skill_entry(name: str, category: str, base_confidence: float, text: str) -> dict:
    """Build a skill entry with evidence and confidence."""
    # Find evidence (sentence containing the skill)
    evidence = None
    sentences = re.split(r"[.!?\n]", text)
    for sentence in sentences:
        if name.lower() in sentence.lower() and len(sentence.strip()) > 10:
            evidence = sentence.strip()[:300]
            break

    # Check for years of experience mentions
    years_exp = None
    pattern = re.compile(
        rf"(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience\s+)?(?:in|with|using)?\s*{re.escape(name)}",
        re.IGNORECASE
    )
    match = pattern.search(text)
    if match:
        years_exp = float(match.group(1))

    return {
        "name": name,
        "proficiency": "INTERMEDIATE",
        "years_of_experience": years_exp,
        "confidence": base_confidence,
        "evidence": evidence,
        "category": category,
    }


def _infer_proficiency(skill_name: str, text: str) -> str:
    """Infer skill proficiency from context clues."""
    lower_text = text.lower()
    lower_skill = skill_name.lower()

    expert_clues = ["expert", "advanced", "architect", "lead", "senior", "10+ years", "8+ years"]
    advanced_clues = ["proficient", "strong", "experienced", "5+ years", "6+ years", "7+ years"]
    beginner_clues = ["beginner", "basic", "familiar", "learning", "new to", "introductory"]

    # Check for expert context
    for clue in expert_clues:
        idx = lower_text.find(lower_skill)
        if idx >= 0:
            context = lower_text[max(0, idx - 100):idx + len(lower_skill) + 100]
            if clue in context:
                return "EXPERT"

    # Check for advanced context
    for clue in advanced_clues:
        idx = lower_text.find(lower_skill)
        if idx >= 0:
            context = lower_text[max(0, idx - 100):idx + len(lower_skill) + 100]
            if clue in context:
                return "ADVANCED"

    # Check for beginner context
    for clue in beginner_clues:
        idx = lower_text.find(lower_skill)
        if idx >= 0:
            context = lower_text[max(0, idx - 100):idx + len(lower_skill) + 100]
            if clue in context:
                return "BEGINNER"

    return "INTERMEDIATE"
