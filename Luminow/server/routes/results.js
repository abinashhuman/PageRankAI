import express from 'express';
import { ResultsStorage } from '../../src/storage/resultsStorage.js';

const router = express.Router();
const storage = new ResultsStorage();

/**
 * GET /api/results
 * Get all analysis results
 */
router.get('/', async (req, res) => {
  try {
    const results = await storage.getAll();
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

/**
 * GET /api/results/:id
 * Get a specific analysis result by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await storage.getById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

/**
 * DELETE /api/results/:id
 * Delete a specific analysis result
 */
router.delete('/:id', async (req, res) => {
  try {
    await storage.delete(req.params.id);
    res.json({ success: true, message: 'Result deleted' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'Failed to delete result' });
  }
});

export { router as resultsRouter };
