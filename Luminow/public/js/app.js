/**
 * Luminow - SEO & GEO Analysis Tool
 * Frontend Application
 */

class LuminowApp {
  constructor() {
    this.currentResults = null;
    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.loadHistory();
  }

  bindElements() {
    this.form = document.getElementById('analyzeForm');
    this.urlInput = document.getElementById('urlInput');
    this.analyzeBtn = document.getElementById('analyzeBtn');
    this.btnText = this.analyzeBtn.querySelector('.btn-text');
    this.btnLoader = this.analyzeBtn.querySelector('.btn-loader');
    this.resultsSection = document.getElementById('results');
    this.historySection = document.getElementById('history');
    this.historyList = document.getElementById('historyList');
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.loadingStatus = document.getElementById('loadingStatus');
    this.errorToast = document.getElementById('errorToast');
    this.tabs = document.querySelectorAll('.tab');
    this.tabPanes = document.querySelectorAll('.tab-pane');
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleAnalyze(e));

    // Tab navigation
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // History link
    document.getElementById('historyLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.showHistory();
    });

    // Toast close
    this.errorToast.querySelector('.toast-close').addEventListener('click', () => {
      this.hideError();
    });

    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  async handleAnalyze(e) {
    e.preventDefault();

    const url = this.urlInput.value.trim();
    if (!url) return;

    // Validate URL
    try {
      new URL(url);
    } catch {
      this.showError('Please enter a valid URL');
      return;
    }

    this.showLoading();

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Analysis failed');
      }

      const results = await response.json();
      this.currentResults = results;
      this.displayResults(results);
      this.loadHistory();
    } catch (error) {
      console.error('Analysis error:', error);
      this.showError(error.message || 'Failed to analyze URL');
    } finally {
      this.hideLoading();
    }
  }

  displayResults(results) {
    this.historySection.style.display = 'none';
    this.resultsSection.style.display = 'block';

    // Animate scores
    setTimeout(() => {
      this.animateScore('overall', results.overallScore.score, results.overallScore.grade);
      this.animateScore('seo', results.seo.score);
      this.animateScore('geo', results.geo.score);
    }, 100);

    // Display issues
    this.displayIssues('seoIssues', results.seo.issues);
    this.displayIssues('geoIssues', results.geo.issues);

    // Display checks
    this.displayChecks('seoChecks', results.seo.checks, 'SEO');
    this.displayChecks('geoChecks', results.geo.checks, 'GEO');

    // Display recommendations
    this.displayRecommendations(results);

    // Reset to issues tab
    this.switchTab('issues');
  }

  animateScore(type, score, grade = null) {
    const numberEl = document.getElementById(`${type}Number`);
    const progressEl = document.getElementById(`${type}Progress`);
    const gradeEl = document.getElementById(`${type}Grade`);

    // Animate number
    let current = 0;
    const duration = 1000;
    const step = score / (duration / 16);

    const animate = () => {
      current = Math.min(current + step, score);
      numberEl.textContent = Math.round(current);

      // Update progress ring
      const circumference = 339.292;
      const offset = circumference - (current / 100) * circumference;
      progressEl.style.strokeDashoffset = offset;

      if (current < score) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    if (gradeEl && grade) {
      gradeEl.textContent = grade;
    }
  }

  displayIssues(containerId, issues) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!issues || issues.length === 0) {
      container.innerHTML = '<p class="no-issues">No issues found!</p>';
      return;
    }

    issues.forEach(issue => {
      const item = document.createElement('div');
      item.className = `issue-item ${issue.severity}`;
      item.innerHTML = `
        <span class="issue-badge ${issue.severity}">${issue.severity}</span>
        <div>
          <div class="issue-message">${this.escapeHtml(issue.message)}</div>
          <div class="issue-category">${this.formatCategory(issue.category)}</div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  displayChecks(containerId, checks, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    Object.entries(checks).forEach(([name, check]) => {
      const scoreClass = check.score >= 70 ? 'good' : check.score >= 50 ? 'warning' : 'poor';
      const statusIcon = check.passed ? '&#10003;' : '&#10007;';
      const statusClass = check.passed ? 'pass' : 'fail';

      const card = document.createElement('div');
      card.className = 'check-card';
      card.innerHTML = `
        <div class="check-header">
          <span class="check-name">${this.formatCategory(name)}</span>
          <span class="check-score ${scoreClass}">${check.score}</span>
        </div>
        <div class="check-status">
          <span class="status-icon ${statusClass}">${statusIcon}</span>
          <span>${check.passed ? 'Passed' : 'Needs improvement'}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  displayRecommendations(results) {
    const container = document.getElementById('recommendationsList');
    container.innerHTML = '';

    const allRecs = [
      ...results.seo.recommendations.map(r => ({ ...r, type: 'SEO' })),
      ...results.geo.recommendations.map(r => ({ ...r, type: 'GEO' })),
    ];

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allRecs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    if (allRecs.length === 0) {
      container.innerHTML = '<p class="no-issues">No recommendations - your page is well optimized!</p>';
      return;
    }

    allRecs.slice(0, 20).forEach(rec => {
      const item = document.createElement('div');
      item.className = 'recommendation-item';
      item.innerHTML = `
        <span class="rec-priority ${rec.priority}">${rec.priority}</span>
        <div class="rec-content">
          <div class="rec-text">${this.escapeHtml(rec.recommendation)}</div>
          <div class="rec-category">${rec.type} - ${this.formatCategory(rec.category)}</div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  switchTab(tabId) {
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    this.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
  }

  async loadHistory() {
    try {
      const response = await fetch('/api/results');
      const results = await response.json();
      this.displayHistory(results);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  displayHistory(results) {
    this.historyList.innerHTML = '';

    if (!results || results.length === 0) {
      this.historyList.innerHTML = `
        <div class="history-empty">
          <p>No analysis history yet. Analyze a URL to get started!</p>
        </div>
      `;
      return;
    }

    results.forEach(result => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-info">
          <div class="history-url">${this.escapeHtml(result.url)}</div>
          <div class="history-date">${this.formatDate(result.analyzedAt)}</div>
        </div>
        <div class="history-scores">
          <div class="history-score">
            <div class="history-score-value">${result.overallScore || '--'}</div>
            <div class="history-score-label">Overall</div>
          </div>
          <div class="history-score">
            <div class="history-score-value" style="color: #3b82f6">${result.seoScore || '--'}</div>
            <div class="history-score-label">SEO</div>
          </div>
          <div class="history-score">
            <div class="history-score-value" style="color: #10b981">${result.geoScore || '--'}</div>
            <div class="history-score-label">GEO</div>
          </div>
        </div>
      `;

      item.addEventListener('click', () => this.loadResult(result.id));
      this.historyList.appendChild(item);
    });
  }

  async loadResult(id) {
    try {
      const response = await fetch(`/api/results/${id}`);
      const result = await response.json();
      this.currentResults = result;
      this.displayResults(result);
      this.urlInput.value = result.url;

      // Switch nav
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.querySelector('.nav-link:first-child').classList.add('active');
    } catch (error) {
      console.error('Failed to load result:', error);
      this.showError('Failed to load analysis result');
    }
  }

  showHistory() {
    this.resultsSection.style.display = 'none';
    this.historySection.style.display = 'block';
    this.loadHistory();
  }

  showLoading() {
    this.loadingOverlay.style.display = 'flex';
    this.analyzeBtn.disabled = true;
    this.btnText.style.display = 'none';
    this.btnLoader.style.display = 'block';

    // Animate loading status
    const statuses = [
      'Launching headless browser...',
      'Loading webpage...',
      'Extracting content...',
      'Running SEO analysis...',
      'Running GEO analysis...',
      'Generating recommendations...',
    ];

    let i = 0;
    this.loadingInterval = setInterval(() => {
      this.loadingStatus.textContent = statuses[i % statuses.length];
      i++;
    }, 2000);
  }

  hideLoading() {
    this.loadingOverlay.style.display = 'none';
    this.analyzeBtn.disabled = false;
    this.btnText.style.display = 'block';
    this.btnLoader.style.display = 'none';

    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
    }
  }

  showError(message) {
    this.errorToast.querySelector('.toast-message').textContent = message;
    this.errorToast.style.display = 'flex';

    setTimeout(() => this.hideError(), 5000);
  }

  hideError() {
    this.errorToast.style.display = 'none';
  }

  formatCategory(category) {
    return category
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new LuminowApp();
});
