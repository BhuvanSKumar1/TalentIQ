import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  parseNaturalLanguageQuery,
  searchCandidates,
  getSearchSuggestions,
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  SearchFilters,
} from '../services/search.service';
import { metrics } from '../services/metrics.service';

// ============================================================
// Search candidates
export const searchController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q, skills, minExperience, maxExperience, location, educationLevel, minMatchScore, jobId, sortBy, sortOrder, page, limit } = req.query;

    const query = (q as string) || '';

    // Parse natural language
    const parsedQuery = parseNaturalLanguageQuery(query);

    // Merge explicit skill filters
    if (skills) {
      const explicitSkills = (skills as string).split(',').map(s => s.trim());
      for (const s of explicitSkills) {
        if (!parsedQuery.skills.includes(s)) parsedQuery.skills.push(s);
        if (!parsedQuery.desiredSkills.includes(s)) parsedQuery.desiredSkills.push(s);
      }
    }

    const filters: SearchFilters = {
      skills: skills ? (skills as string).split(',').map(s => s.trim()) : undefined,
      minExperience: minExperience ? parseFloat(minExperience as string) : undefined,
      maxExperience: maxExperience ? parseFloat(maxExperience as string) : undefined,
      location: location as string,
      educationLevel: educationLevel as string,
      minMatchScore: minMatchScore ? parseFloat(minMatchScore as string) : undefined,
      jobId: jobId as string,
      sortBy: sortBy as SearchFilters['sortBy'],
      sortOrder: sortOrder as SearchFilters['sortOrder'],
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    };

    const start = Date.now();
    const result = await searchCandidates(parsedQuery, filters);
    metrics.recordServiceLatency('search.query', Date.now() - start);
    metrics.incrementCounter('search.queries');

    res.json({
      success: true,
      data: result.results,
      parsedQuery: result.parsedQuery,
      pagination: {
        total: result.total,
        page: filters.page || 1,
        limit: filters.limit || 20,
        totalPages: Math.ceil(result.total / (filters.limit || 20)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Get search suggestions
export const searchSuggestionsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;
    const suggestions = await getSearchSuggestions((q as string) || '');

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Save search
export const saveSearchController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, query, filters, resultCount } = req.body;
    const organizationId = req.user?.organizationId || '';

    const search = await saveSearch(name, query, filters || {}, resultCount || 0, organizationId);

    res.json({
      success: true,
      data: search,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Get saved searches
export const getSavedSearchesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.user?.organizationId || '';
    const searches = await getSavedSearches(organizationId);

    res.json({
      success: true,
      data: searches,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Delete saved search
export const deleteSavedSearchController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || '';
    const deleted = await deleteSavedSearch(id, organizationId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Saved search not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
