/**
 * Results Storage Module
 * Stores analysis results locally in JSON files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ResultsStorage {
  constructor(storagePath = null) {
    this.storagePath = storagePath || path.join(__dirname, '../../data');
    this.indexFile = path.join(this.storagePath, 'index.json');
    this.initialized = false;
  }

  /**
   * Initialize storage directory
   */
  async init() {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.storagePath, { recursive: true });

      // Check if index exists
      try {
        await fs.access(this.indexFile);
      } catch {
        // Create empty index
        await fs.writeFile(this.indexFile, JSON.stringify({ results: [] }, null, 2));
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  /**
   * Save analysis results
   * @param {Object} results - Analysis results to save
   * @returns {string} - ID of saved results
   */
  async save(results) {
    await this.init();

    const id = results.id || crypto.randomUUID();
    const filename = `${id}.json`;
    const filepath = path.join(this.storagePath, filename);

    // Save full results to file
    await fs.writeFile(filepath, JSON.stringify(results, null, 2));

    // Update index
    const index = await this.loadIndex();
    const indexEntry = {
      id,
      url: results.url,
      analyzedAt: results.analyzedAt,
      overallScore: results.overallScore?.score,
      seoScore: results.seo?.score,
      geoScore: results.geo?.score,
    };

    // Remove existing entry if any
    index.results = index.results.filter(r => r.id !== id);

    // Add new entry at beginning
    index.results.unshift(indexEntry);

    // Keep only last 100 results in index
    index.results = index.results.slice(0, 100);

    await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));

    return id;
  }

  /**
   * Get all results (from index)
   * @returns {Array} - List of results summaries
   */
  async getAll() {
    await this.init();

    const index = await this.loadIndex();
    return index.results;
  }

  /**
   * Get a specific result by ID
   * @param {string} id - Result ID
   * @returns {Object|null} - Full results or null if not found
   */
  async getById(id) {
    await this.init();

    const filepath = path.join(this.storagePath, `${id}.json`);

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a result
   * @param {string} id - Result ID to delete
   */
  async delete(id) {
    await this.init();

    const filepath = path.join(this.storagePath, `${id}.json`);

    // Delete file
    try {
      await fs.unlink(filepath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Update index
    const index = await this.loadIndex();
    index.results = index.results.filter(r => r.id !== id);
    await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
  }

  /**
   * Load the index file
   */
  async loadIndex() {
    try {
      const content = await fs.readFile(this.indexFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { results: [] };
    }
  }

  /**
   * Clear all results
   */
  async clear() {
    await this.init();

    const index = await this.loadIndex();

    // Delete all result files
    for (const result of index.results) {
      try {
        await fs.unlink(path.join(this.storagePath, `${result.id}.json`));
      } catch {
        // Ignore errors
      }
    }

    // Reset index
    await fs.writeFile(this.indexFile, JSON.stringify({ results: [] }, null, 2));
  }
}
