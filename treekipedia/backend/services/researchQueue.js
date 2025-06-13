/**
 * Research Queue System for Treekipedia
 * Manages and processes research requests with rate limiting and retry logic
 */
const { EventEmitter } = require('events');

// Create a rate limiter for API calls
class RateLimiter {
  constructor(maxRequestsPerMinute) {
    this.maxRequestsPerMinute = maxRequestsPerMinute || 10;
    this.requestTimestamps = [];
  }

  async waitForRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    
    // Remove timestamps older than one minute
    this.requestTimestamps = this.requestTimestamps.filter(time => time > oneMinuteAgo);
    
    // If we have reached the limit, wait until we can make another request
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = oldestTimestamp + 60 * 1000 - now + 100; // Add 100ms buffer
      
      console.log(`Rate limit reached. Waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForRateLimit(); // Check again after waiting
    }
    
    // Add current timestamp to the queue
    this.requestTimestamps.push(now);
    return true;
  }
}

// Research queue singleton
class ResearchQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.perplexityRateLimiter = new RateLimiter(5); // 5 requests per minute for Perplexity
    this.openaiRateLimiter = new RateLimiter(20);   // 20 requests per minute for OpenAI
    this.retryDelays = [5000, 10000, 20000, 40000, 60000]; // Exponential backoff delays
  }

  /**
   * Add a new research task to the queue
   * @param {Object} task - The research task with all necessary parameters
   * @returns {Promise} - Resolves when task is completed
   */
  async addTask(task) {
    console.log(`Adding research task for ${task.scientificName} (${task.taxonId}) to queue`);
    
    return new Promise((resolve, reject) => {
      const taskWithCallbacks = {
        ...task,
        resolve,
        reject,
        attempts: 0,
        added: Date.now()
      };
      
      this.queue.push(taskWithCallbacks);
      this.startProcessing();
    });
  }

  /**
   * Start processing the queue if not already processing
   */
  startProcessing() {
    if (this.processing) return;
    
    this.processing = true;
    this.processNext();
  }

  /**
   * Process the next task in the queue
   */
  async processNext() {
    if (this.queue.length === 0) {
      console.log('Research queue is empty. Processing paused.');
      this.processing = false;
      return;
    }

    const task = this.queue.shift();
    console.log(`Processing research task for ${task.scientificName} (${task.taxonId}), attempt #${task.attempts + 1}`);
    
    try {
      // Wait for rate limiters before processing
      if (task.apiType === 'perplexity' || !task.apiType) {
        await this.perplexityRateLimiter.waitForRateLimit();
      } else if (task.apiType === 'openai') {
        await this.openaiRateLimiter.waitForRateLimit();
      }
      
      // Execute the task
      const result = await task.processor(task);
      
      // Resolve the promise for the task
      task.resolve(result);
      
      // Emit success event
      this.emit('taskComplete', { 
        taxonId: task.taxonId, 
        scientificName: task.scientificName,
        result 
      });
    } catch (error) {
      console.error(`Error processing research task for ${task.scientificName}:`, error);
      
      // Check if we should retry
      task.attempts++;
      if (task.attempts <= (task.maxAttempts || 3)) {
        const delay = this.retryDelays[Math.min(task.attempts - 1, this.retryDelays.length - 1)];
        console.log(`Retrying task for ${task.scientificName} in ${delay}ms (attempt ${task.attempts})`);
        
        setTimeout(() => {
          // Put the task back in the queue
          this.queue.push(task);
          this.emit('taskRetry', { 
            taxonId: task.taxonId, 
            scientificName: task.scientificName,
            attempts: task.attempts,
            error: error.message 
          });
        }, delay);
      } else {
        // Maximum retry attempts reached, reject the promise
        task.reject(error);
        this.emit('taskFailed', { 
          taxonId: task.taxonId, 
          scientificName: task.scientificName,
          error: error.message 
        });
      }
    }
    
    // Process the next task
    setTimeout(() => this.processNext(), 500);
  }

  /**
   * Get current queue status
   * @returns {Object} - Current queue stats
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      oldestTask: this.queue.length > 0 ? this.queue[0].added : null,
      tasksBySpecies: this.queue.map(t => ({
        taxonId: t.taxonId,
        scientificName: t.scientificName,
        added: t.added,
        attempts: t.attempts
      }))
    };
  }
}

// Create singleton instance
const researchQueue = new ResearchQueue();

module.exports = researchQueue;