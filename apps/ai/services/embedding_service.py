"""Generate embeddings for semantic search.

Uses a simple TF-IDF approach for local development.
Can be swapped for OpenAI embeddings in production.
"""

import re
import math
from collections import Counter
from typing import Optional


# Common English stop words
STOP_WORDS = frozenset({
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
    "be", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "need", "dare",
    "it", "its", "this", "that", "these", "those", "i", "you", "he",
    "she", "we", "they", "me", "him", "her", "us", "them", "my", "your",
    "his", "our", "their", "what", "which", "who", "whom", "when", "where",
    "how", "not", "no", "nor", "so", "too", "very", "just", "than", "also",
    "if", "then", "else", "about", "up", "out", "into", "through", "during",
    "before", "after", "above", "below", "between", "under", "again",
    "further", "once", "here", "there", "all", "each", "every", "both",
    "few", "more", "most", "other", "some", "such", "only", "own", "same",
    "while", "because", "although", "since", "unless", "yet", "already",
})


def tokenize(text: str) -> list[str]:
    """Tokenize text into lowercase words."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s.#+]", " ", text)
    tokens = text.split()
    return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]


def compute_tfidf(documents: list[str], max_features: int = 512) -> tuple[list[Counter], list[str]]:
    """Compute TF-IDF vectors for a list of documents.

    Returns:
        List of Counter objects (sparse vectors) and the vocabulary.
    """
    # Build vocabulary
    doc_freq: Counter = Counter()
    tokenized_docs = [tokenize(doc) for doc in documents]

    for tokens in tokenized_docs:
        unique_tokens = set(tokens)
        for token in unique_tokens:
            doc_freq[token] += 1

    # Select top features by document frequency
    vocab = [token for token, _ in doc_freq.most_common(max_features)]
    vocab_index = {token: i for i, token in enumerate(vocab)}

    # Compute TF-IDF
    num_docs = len(documents)
    idf = {}
    for token in vocab:
        idf[token] = math.log((num_docs + 1) / (doc_freq[token] + 1)) + 1

    vectors = []
    for tokens in tokenized_docs:
        tf = Counter(tokens)
        max_tf = max(tf.values()) if tf else 1
        tfidf = Counter()
        for token, count in tf.items():
            if token in vocab_index:
                normalized_tf = 0.5 + 0.5 * (count / max_tf)
                tfidf[token] = normalized_tf * idf.get(token, 1.0)
        vectors.append(tfidf)

    return vectors, vocab


def generate_embedding(text: str, max_features: int = 512) -> list[float]:
    """Generate a dense embedding vector from text.

    Uses TF-IDF with dimensionality reduction to produce a fixed-size vector.
    This is a local, dependency-free approach for development.
    """
    # Create a "document" from the text
    tokens = tokenize(text)
    if not tokens:
        return [0.0] * max_features

    # Hash-based dimensionality reduction
    # Map each token to a fixed set of dimensions
    vector = [0.0] * max_features

    # Compute term frequencies
    tf = Counter(tokens)
    total = len(tokens)

    for token, count in tf.items():
        # Use hash to determine which dimensions this token maps to
        h = hash(token)
        dim1 = h % max_features
        dim2 = (h >> 16) % max_features

        # Weight by TF
        weight = (count / total) * math.log(total / (tf[token] + 1) + 1)

        vector[dim1] += weight
        vector[dim2] -= weight * 0.5

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vector)) or 1.0
    vector = [x / norm for x in vector]

    return vector


def compute_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1)) or 1.0
    norm2 = math.sqrt(sum(b * b for b in vec2)) or 1.0
    return dot / (norm1 * norm2)


def generate_candidate_embedding(profile_text: str) -> list[float]:
    """Generate an embedding for a candidate profile.

    Enriches the text with weighted sections for better semantic matching.
    """
    # Weight the profile text — skills and experience matter more
    enriched = profile_text * 2  # Give double weight to profile text
    return generate_embedding(enriched)
