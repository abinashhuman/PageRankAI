/**
 * Luminow - SEO & GEO Analysis Tool
 * Frontend Application
 *
 * SEO Score: 0-100 (traditional scale)
 * GEO Score: 0-800 (credit score style with bands)
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

    // Mode dropdown elements
    this.modeDropdown = document.querySelector('.mode-dropdown');
    this.modeBtn = document.getElementById('modeBtn');
    this.modeText = document.getElementById('modeText');
    this.modeDropdownMenu = document.getElementById('modeDropdown');
    this.modeOptions = document.querySelectorAll('.mode-option');
    this.currentMode = 'Focused'; // Default mode
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

    // Mode dropdown toggle
    if (this.modeBtn) {
      this.modeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.modeDropdown.classList.toggle('open');
      });
    }

    // Mode option selection
    if (this.modeOptions) {
      this.modeOptions.forEach(option => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          const mode = option.dataset.mode;
          this.selectMode(mode);
          this.modeDropdown.classList.remove('open');
        });
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.modeDropdown && !this.modeDropdown.contains(e.target)) {
        this.modeDropdown.classList.remove('open');
      }
    });
  }

  selectMode(mode) {
    this.currentMode = mode;
    this.modeText.textContent = mode;

    // Update checkmarks
    document.getElementById('checkFocused').textContent = mode === 'Focused' ? '✓' : '';
    document.getElementById('checkMagic').textContent = mode === 'Magic' ? '✓' : '';

    // Trigger golden dust animation when Magic is selected
    if (mode === 'Magic') {
      this.createGoldenDust();
    }
  }

  createGoldenDust() {
    const modeBtn = this.modeBtn;
    const rect = modeBtn.getBoundingClientRect();

    // Create container for dust particles
    const container = document.createElement('div');
    container.className = 'golden-dust-container';
    container.style.position = 'fixed';
    container.style.left = `${rect.left + rect.width / 2}px`;
    container.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(container);

    // Create multiple dust particles
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');

      // Alternate between round and star shapes
      if (i % 3 === 0) {
        particle.className = 'golden-dust star';
      } else {
        particle.className = 'golden-dust';
      }

      // Random direction for each particle
      const angle = (i / particleCount) * 360 + Math.random() * 30;
      const distance = 40 + Math.random() * 60;
      const tx = Math.cos(angle * Math.PI / 180) * distance;
      const ty = Math.sin(angle * Math.PI / 180) * distance;

      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      particle.style.animationDelay = `${Math.random() * 0.15}s`;

      container.appendChild(particle);
    }

    // Remove container after animation completes
    setTimeout(() => {
      container.remove();
    }, 1200);
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
      // Overall score (0-100)
      this.animateScore('overall', results.overallScore.score, results.overallScore.grade);

      // SEO score (0-100)
      this.animateScore('seo', results.seo.score);

      // GEO score (0-800) - special handling
      this.animateGeoScore(results.geo);
    }, 100);

    // Display issues
    this.displayIssues('seoIssues', results.seo.issues);
    this.displayIssues('geoIssues', results.geo.issues);

    // Display checks/categories
    this.displaySEOCategories('seoChecks', results.seo.categories);
    this.displayGEOPillars('geoChecks', results.geo.pillars);

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

      // Update progress ring (for 0-100 scores)
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

  animateGeoScore(geoResults) {
    const numberEl = document.getElementById('geoNumber');
    const progressEl = document.getElementById('geoProgress');
    const bandEl = document.getElementById('geoBand');

    const score = geoResults.score;
    const maxScore = 800;
    const band = geoResults.band;

    // Animate number
    let current = 0;
    const duration = 1000;
    const step = score / (duration / 16);

    const animate = () => {
      current = Math.min(current + step, score);
      numberEl.textContent = Math.round(current);

      // Update progress ring (normalize to 0-100 for display)
      const circumference = 339.292;
      const normalizedScore = (current / maxScore) * 100;
      const offset = circumference - (normalizedScore / 100) * circumference;
      progressEl.style.strokeDashoffset = offset;

      // Update color based on band
      if (band) {
        progressEl.style.stroke = band.color;
      }

      if (current < score) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    // Display band
    if (bandEl && band) {
      bandEl.textContent = band.band;
      bandEl.style.color = band.color;
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
          <div class="issue-category">${this.formatCategory(issue.category || issue.pillar)}</div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  displaySEOCategories(containerId, categories) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!categories) return;

    Object.entries(categories).forEach(([name, category]) => {
      const scoreClass = category.percentage >= 70 ? 'good' : category.percentage >= 50 ? 'warning' : 'poor';
      const statusIcon = category.passed ? '&#10003;' : '&#10007;';
      const statusClass = category.passed ? 'pass' : 'fail';

      const card = document.createElement('div');
      card.className = 'check-card';
      card.innerHTML = `
        <div class="check-header">
          <span class="check-name">${this.formatCategory(name)}</span>
          <span class="check-score ${scoreClass}">${category.score}/${category.maxScore}</span>
        </div>
        <div class="check-progress-bar">
          <div class="check-progress-fill ${scoreClass}" style="width: ${category.percentage}%"></div>
        </div>
        <div class="check-status">
          <span class="status-icon ${statusClass}">${statusIcon}</span>
          <span>${category.passed ? 'Passed' : 'Needs improvement'}</span>
        </div>
        <div class="check-details">
          ${this.renderCheckDetails(category.checks)}
        </div>
      `;
      container.appendChild(card);
    });
  }

  displayGEOPillars(containerId, pillars) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!pillars) return;

    Object.entries(pillars).forEach(([name, pillar]) => {
      const scoreClass = pillar.percentage >= 70 ? 'good' : pillar.percentage >= 50 ? 'warning' : 'poor';
      const statusIcon = pillar.passed ? '&#10003;' : '&#10007;';
      const statusClass = pillar.passed ? 'pass' : 'fail';

      const card = document.createElement('div');
      card.className = 'check-card geo-pillar';
      card.innerHTML = `
        <div class="check-header">
          <span class="check-name">${pillar.pillarName || this.formatCategory(name)}</span>
          <span class="check-score ${scoreClass}">${pillar.score}/100</span>
        </div>
        <div class="check-progress-bar">
          <div class="check-progress-fill ${scoreClass}" style="width: ${pillar.percentage}%"></div>
        </div>
        <div class="check-status">
          <span class="status-icon ${statusClass}">${statusIcon}</span>
          <span>${pillar.passed ? 'Passed' : 'Needs improvement'}</span>
        </div>
        <div class="check-details">
          ${this.renderCheckDetails(pillar.checks, true)}
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderCheckDetails(checks, isGeo = false) {
    if (!checks) return '';

    return Object.entries(checks)
      .map(([key, check]) => {
        const statusClass = check.passed ? 'detail-pass' : 'detail-fail';
        const icon = check.passed ? '&#10003;' : '&#10007;';
        const example = isGeo ? this.getGeoExample(key, check.passed) : null;
        const tooltipAttr = example ? `data-tooltip="${this.escapeHtml(example)}"` : '';
        const tooltipClass = example ? 'has-tooltip' : '';

        return `
          <div class="check-detail-item ${statusClass} ${tooltipClass}" ${tooltipAttr}>
            <span class="detail-icon">${icon}</span>
            <span class="detail-name">${this.formatCategory(key)}</span>
            <span class="detail-value">${check.value}</span>
            ${example ? '<span class="tooltip-icon">?</span>' : ''}
          </div>
        `;
      })
      .join('');
  }

  getGeoExample(checkKey, passed) {
    const examples = {
      // AI Crawl Access & Snippet Controls (v2.0)
      httpStatus: {
        pass: 'Good: HTTP 200 OK allows AI crawlers to access content',
        fail: 'Bad: HTTP 404/500 blocks AI from reading page content'
      },
      noindex: {
        pass: 'Good: Page is indexable by AI search engines',
        fail: 'Bad: <meta name="robots" content="noindex"> blocks AI indexing'
      },
      oaiSearchBot: {
        pass: 'Good: ChatGPT/OpenAI can crawl and cite this page',
        fail: 'Bad: robots.txt blocks OAI-SearchBot from accessing content'
      },
      perplexityBot: {
        pass: 'Good: Perplexity AI can crawl and cite this page',
        fail: 'Bad: robots.txt blocks PerplexityBot from accessing content'
      },
      claudeBot: {
        pass: 'Good: Anthropic Claude can crawl and cite this page',
        fail: 'Bad: robots.txt blocks ClaudeBot from accessing content'
      },
      gptBot: {
        pass: 'Good: OpenAI GPTBot can access for training/browsing',
        fail: 'Bad: robots.txt blocks GPTBot from accessing content'
      },
      googleExtended: {
        pass: 'Good: Google Gemini/Bard can train on this content',
        fail: 'Bad: robots.txt blocks Google-Extended crawler'
      },
      snippetControls: {
        pass: 'Good: No snippet restrictions - AI can quote content freely',
        fail: 'Bad: max-snippet:0 prevents AI from displaying content excerpts'
      },

      // Product Metadata Readiness
      productSchema: {
        pass: 'Good: {"@type":"Product", "name":"...", "offers":{...}}',
        fail: 'Bad: No Product schema - AI cannot extract structured data'
      },
      offerFields: {
        pass: 'Good: "offers":{"price":"999", "priceCurrency":"USD", "availability":"InStock"}',
        fail: 'Bad: Missing price/currency/availability in schema'
      },
      schemaConsistency: {
        pass: 'Good: Schema data matches visible page content',
        fail: 'Bad: Schema price/title differs from what users see on page'
      },
      socialMeta: {
        pass: 'Good: Open Graph + Twitter Card meta tags present',
        fail: 'Bad: No og:title, og:image - poor social/AI preview'
      },
      variantHandling: {
        pass: 'Good: Each variant has unique URL or proper schema',
        fail: 'Bad: Product variants not properly structured for AI'
      },

      // Entity Disambiguation & Identifiers
      topicClarity: {
        pass: 'Good: Page clearly about one specific product/topic',
        fail: 'Bad: Unclear focus - AI cannot determine main subject'
      },
      productIdentity: {
        pass: 'Good: Clear brand + product name + model in title and H1',
        fail: 'Bad: Generic title - AI may confuse with similar products'
      },
      productIdentifiers: {
        pass: 'Good: GTIN/UPC: 0194253154082, SKU: MTQR3LL/A, MPN: A2846',
        fail: 'Bad: No unique identifiers - cannot match across retailers'
      },
      schemaIdentifiers: {
        pass: 'Good: "gtin":"0194253154082", "sku":"...", "mpn":"..."',
        fail: 'Bad: Schema missing gtin/sku/mpn identifiers'
      },
      categoryTaxonomy: {
        pass: 'Good: Electronics > Phones > Smartphones > iPhone',
        fail: 'Bad: No category breadcrumb - AI cannot classify product'
      },
      variantIdentifiers: {
        pass: 'Good: Each color/size variant has unique identifier',
        fail: 'Bad: Variants share same SKU - AI cannot distinguish'
      },

      // Machine-Scannable Information Architecture
      headingHierarchy: {
        pass: 'Good: H1 > H2 (Specs, Reviews, FAQ) > H3 (subsections)',
        fail: 'Bad: Only H1 or skipped levels - hard for AI to chunk content'
      },
      bulletLists: {
        pass: 'Good: <ul><li>48MP camera</li><li>256GB storage</li></ul>',
        fail: 'Bad: Specs in paragraphs - AI cannot easily extract features'
      },
      paragraphLength: {
        pass: 'Good: Short paragraphs (2-3 sentences each)',
        fail: 'Bad: Long paragraphs - key facts buried, harder to cite'
      },
      specTables: {
        pass: 'Good: <table><tr><th>Display</th><td>6.1" OLED</td></tr></table>',
        fail: 'Bad: No tables - technical specs not in structured format'
      },
      semanticHTML: {
        pass: 'Good: <main>, <article>, <section>, <aside> elements used',
        fail: 'Bad: Only <div> elements - no semantic meaning for AI'
      },
      contentVisible: {
        pass: 'Good: Content visible without JavaScript interaction',
        fail: 'Bad: Content hidden in tabs/accordions - AI may miss it'
      },

      // Shopping Intent Coverage
      useCases: {
        pass: 'Good: "Perfect for photographers, content creators..."',
        fail: 'Bad: No use cases - cannot answer "Is X good for Y?"'
      },
      compatibility: {
        pass: 'Good: "Works with iOS 17+, Qi2 chargers, MagSafe..."',
        fail: 'Bad: No compatibility info - cannot answer "Does X work with Y?"'
      },
      constraints: {
        pass: 'Good: "Requires 5G network, not waterproof below 6m"',
        fail: 'Bad: No limitations listed - incomplete product info'
      },
      whatsIncluded: {
        pass: 'Good: "In the box: Phone, USB-C cable, documentation"',
        fail: 'Bad: No "what\'s included" - common purchase question unanswered'
      },
      careInfo: {
        pass: 'Good: "Clean with soft cloth, avoid extreme temperatures"',
        fail: 'Bad: No care instructions - maintenance questions unanswered'
      },
      policies: {
        pass: 'Good: "Free shipping over $50, 30-day returns, 1-year warranty"',
        fail: 'Bad: No policy info - trust-related questions unanswered'
      },
      faqContent: {
        pass: 'Good: FAQ section with common questions and answers',
        fail: 'Bad: No FAQ - missing answers to common queries'
      },

      // Answerability (v2.0 additions)
      specifications: {
        pass: 'Good: Detailed specs with measurements, dimensions, capacity',
        fail: 'Bad: No technical specifications - cannot answer "what are the specs?"'
      },

      // Evidence, Justification & Citability (v2.0 - highest weight pillar)
      statistics: {
        pass: 'Good: "48MP sensor", "22-hour battery", "4x faster A17 chip"',
        fail: 'Bad: No specific numbers - claims too vague to cite'
      },
      sourceCitations: {
        pass: 'Good: "According to DisplayMate...", "FCC certified..."',
        fail: 'Bad: Claims without sources - reduced credibility for AI'
      },
      definitions: {
        pass: 'Good: "ProMotion is adaptive 120Hz refresh technology..."',
        fail: 'Bad: Technical jargon without explanation'
      },
      authorityCues: {
        pass: 'Good: "Award-winning", "1M+ sold", "ISO 9001 certified"',
        fail: 'Bad: No social proof or authority signals'
      },
      outboundRefs: {
        pass: 'Good: Links to official specs, certifications, reviews',
        fail: 'Bad: No external references - appears less authoritative'
      },
      contentFreshness: {
        pass: 'Good: Updated date visible (e.g., "Last updated: Dec 2024")',
        fail: 'Bad: No dates - AI may deprioritize stale content'
      },
      factDensity: {
        pass: 'Good: High fact density (5+ facts per 100 words)',
        fail: 'Bad: Low fact density - content is filler, not citable facts'
      },

      // Multimodal Readiness
      imageCount: {
        pass: 'Good: 5+ images showing product from multiple angles',
        fail: 'Bad: No/few images - AI cannot understand product visually'
      },
      imageAlt: {
        pass: 'Good: alt="iPhone 15 Pro in Natural Titanium, front view"',
        fail: 'Bad: alt="" or alt="img1" - AI cannot understand image'
      },
      imageReferences: {
        pass: 'Good: "As shown above, the camera features..."',
        fail: 'Bad: Images not referenced in text content'
      },
      videoContent: {
        pass: 'Good: Product video with transcript/description',
        fail: 'Bad: Video without accessible text alternative'
      },
      imageSchema: {
        pass: 'Good: "image":["url1","url2"] in Product schema',
        fail: 'Bad: No images in schema - AI cannot access them'
      },

      // Authority Signals
      sellerIdentity: {
        pass: 'Good: {"@type":"Organization", "name":"Apple Inc."}',
        fail: 'Bad: No Organization schema - seller identity unclear'
      },
      transparentPolicies: {
        pass: 'Good: Links to Shipping, Returns, Warranty, Privacy, Terms',
        fail: 'Bad: Missing policy pages - reduced trust signals'
      },
      reviewIntegrity: {
        pass: 'Good: {"aggregateRating":{"ratingValue":"4.8","reviewCount":"2847"}}',
        fail: 'Bad: Reviews without structured schema data'
      },
      authorityCredentials: {
        pass: 'Good: "Official Store", "Authorized Dealer", "Since 1976"',
        fail: 'Bad: No credentials - cannot verify seller legitimacy'
      },
      contactInfo: {
        pass: 'Good: Phone, email, and physical address visible',
        fail: 'Bad: No contact info - trust and legitimacy concern'
      },
      offSiteAuthority: {
        pass: 'Good: Strong domain authority from external backlinks',
        fail: 'Bad: Limited external authority signals'
      },

      // Generic fallbacks for non-product pages
      notApplicable: {
        pass: 'This check is not applicable for this page type',
        fail: 'This check is not applicable for this page type'
      },
      generalContent: {
        pass: 'Good: Page has sufficient content for analysis',
        fail: 'Bad: Insufficient content for meaningful analysis'
      }
    };

    const example = examples[checkKey];
    if (!example) return null;

    return passed ? example.pass : example.fail;
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
          <div class="rec-category">${rec.type} - ${this.formatCategory(rec.category || rec.pillar)}</div>
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
      // Format GEO score display
      const geoDisplay = result.geoScore !== undefined
        ? `${result.geoScore}/800`
        : '--';

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
            <div class="history-score-value" style="color: #10b981">${geoDisplay}</div>
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

    // Animate loading status with algorithm phases
    const statuses = [
      'Phase 1: Launching headless browser...',
      'Phase 1: Loading webpage...',
      'Phase 1: Checking crawl accessibility...',
      'Phase 2: Detecting page type...',
      'Phase 2: Extracting structured data...',
      'Phase 2: Extracting product data...',
      'Phase 3: Running SEO analysis...',
      'Phase 3: Checking indexability...',
      'Phase 3: Analyzing content quality...',
      'Phase 4: Running GEO analysis...',
      'Phase 4: Checking AI crawl access...',
      'Phase 4: Analyzing citability...',
      'Phase 5: Generating recommendations...',
      'Phase 5: Compiling report...',
    ];

    let i = 0;
    this.loadingInterval = setInterval(() => {
      this.loadingStatus.textContent = statuses[i % statuses.length];
      i++;
    }, 1500);
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
    if (!category) return '';
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
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new LuminowApp();
});
