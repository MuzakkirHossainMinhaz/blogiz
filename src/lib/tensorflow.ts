// TensorFlow.js Client-Side AI - Completely Free Processing
// Note: TensorFlow.js models will be loaded dynamically in the browser

export interface ToxicityResult {
  label: string;
  results: Array<{
    match: boolean;
    probabilities: Float32Array;
  }>;
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  magnitude: number;
}

export interface ContentAnalysis {
  toxicity: ToxicityResult[];
  sentiment: SentimentResult;
  readabilityScore: number;
  suggestedImprovements: string[];
}

class TensorFlowAI {
  private toxicityModel: any = null;
  private sentimentModel: any = null;
  private isInitialized = false;

  async initializeModels() {
    try {
      console.log('Initializing TensorFlow.js models...');
      
      // Dynamically import TensorFlow.js models (client-side only)
      if (typeof window !== 'undefined') {
        // Browser environment - load TensorFlow.js models
        try {
          const toxicity = await import('@tensorflow-models/toxicity');
          this.toxicityModel = await toxicity.load(0.7);
          
          const sentiment = await import('@tensorflow-models/universal-sentence-encoder');
          this.sentimentModel = await sentiment.load();
          
          this.isInitialized = true;
          console.log('TensorFlow.js models initialized successfully');
        } catch (importError) {
          console.warn('TensorFlow.js models not available, using fallback implementations');
          this.initializeFallbackModels();
        }
      } else {
        // Server environment - use fallback implementations
        console.log('Server environment detected, using fallback AI implementations');
        this.initializeFallbackModels();
      }
    } catch (error) {
      console.error('Failed to initialize TensorFlow.js models:', error);
      this.initializeFallbackModels();
    }
  }

  private initializeFallbackModels() {
    // Fallback implementations for server-side or when TF.js is not available
    this.isInitialized = true;
    console.log('Fallback AI models initialized');
  }

  private ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('TensorFlow.js models not initialized. Call initializeModels() first.');
    }
  }

  // Toxicity Detection
  async detectToxicity(text: string): Promise<ToxicityResult[]> {
    try {
      this.ensureInitialized();
      
      if (this.toxicityModel && typeof window !== 'undefined') {
        // Use real TensorFlow.js model
        const predictions = await this.toxicityModel.classify([text]);
        return predictions;
      } else {
        // Fallback implementation
        return this.fallbackToxicityDetection(text);
      }
    } catch (error) {
      console.error('Toxicity detection failed:', error);
      return [];
    }
  }

  private fallbackToxicityDetection(text: string): ToxicityResult[] {
    // Simple keyword-based toxicity detection as fallback
    const toxicWords = ['toxic', 'bad', 'hate', 'awful', 'terrible', 'horrible'];
    const isToxic = toxicWords.some(word => text.toLowerCase().includes(word));
    
    return [{
      label: 'toxicity',
      results: [{
        match: isToxic,
        probabilities: new Float32Array([isToxic ? 0.8 : 0.2, isToxic ? 0.2 : 0.8])
      }]
    }];
  }

  async isContentToxic(text: string): Promise<boolean> {
    try {
      const toxicityResults = await this.detectToxicity(text);
      return toxicityResults.some(result => 
        result.results[0]?.match || false
      );
    } catch (error) {
      console.error('Toxicity check failed:', error);
      return false;
    }
  }

  async getToxicityScore(text: string): Promise<number> {
    try {
      const toxicityResults = await this.detectToxicity(text);
      const toxicLabels = toxicityResults.filter(result => 
        result.results[0]?.match || false
      );
      return toxicLabels.length / Math.max(toxicityResults.length, 1);
    } catch (error) {
      console.error('Toxicity scoring failed:', error);
      return 0;
    }
  }

  // Sentiment Analysis
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      this.ensureInitialized();
      
      if (this.sentimentModel && typeof window !== 'undefined') {
        // Use real TensorFlow.js model
        const embeddings = await this.sentimentModel.embed([text]);
        const embedding = embeddings.arraySync()[0];
        const score = this.calculateSentimentScore(embedding);
        const magnitude = Math.abs(score);
        
        let sentiment: 'positive' | 'negative' | 'neutral';
        if (score > 0.1) {
          sentiment = 'positive';
        } else if (score < -0.1) {
          sentiment = 'negative';
        } else {
          sentiment = 'neutral';
        }

        return { sentiment, score, magnitude };
      } else {
        // Fallback implementation
        return this.fallbackSentimentAnalysis(text);
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return { sentiment: 'neutral', score: 0, magnitude: 0 };
    }
  }

  private fallbackSentimentAnalysis(text: string): SentimentResult {
    // Simple keyword-based sentiment analysis as fallback
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'poor', 'hate', 'worst'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    let score = 0;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min(0.8, positiveCount / Math.max(words.length, 1));
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = Math.max(-0.8, -negativeCount / Math.max(words.length, 1));
    } else {
      sentiment = 'neutral';
      score = 0;
    }
    
    return { sentiment, score, magnitude: Math.abs(score) };
  }

  private calculateSentimentScore(embedding: number[]): number {
    // Simple sentiment calculation based on embedding
    // In a real implementation, this would use a trained model
    return (embedding.reduce((sum, val) => sum + val, 0) / embedding.length) * 2 - 1;
  }

  // Content Analysis
  async analyzeContent(text: string): Promise<ContentAnalysis> {
    try {
      const [toxicity, sentimentResult] = await Promise.all([
        this.detectToxicity(text),
        this.analyzeSentiment(text),
      ]);

      const readabilityScore = this.calculateReadabilityScore(text);
      const suggestedImprovements = this.generateImprovements(text, toxicity, sentimentResult);

      return {
        toxicity,
        sentiment: sentimentResult,
        readabilityScore,
        suggestedImprovements,
      };
    } catch (error) {
      console.error('Content analysis failed:', error);
      return {
        toxicity: [],
        sentiment: { sentiment: 'neutral', score: 0, magnitude: 0 },
        readabilityScore: 0,
        suggestedImprovements: [],
      };
    }
  }

  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Flesch Reading Ease Score (simplified)
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * (avgWordLength / 4.7));
    
    return Math.max(0, Math.min(100, score));
  }

  private generateImprovements(
    text: string, 
    toxicity: ToxicityResult[], 
    sentiment: SentimentResult
  ): string[] {
    const improvements: string[] = [];

    // Toxicity improvements
    const toxicLabels = toxicity.filter(result => result.results[0]?.match);
    if (toxicLabels.length > 0) {
      improvements.push('Consider rephrasing to reduce toxic language');
    }

    // Sentiment improvements
    if (sentiment.sentiment === 'negative' && sentiment.magnitude > 0.5) {
      improvements.push('Content appears very negative - consider adding balanced perspectives');
    }

    // Readability improvements
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;

    if (avgWordsPerSentence > 20) {
      improvements.push('Consider using shorter sentences for better readability');
    } else if (avgWordsPerSentence < 10) {
      improvements.push('Consider using more complex sentences for better flow');
    }

    // Length improvements
    if (text.length < 100) {
      improvements.push('Content is quite short - consider adding more detail');
    } else if (text.length > 1000) {
      improvements.push('Content is quite long - consider breaking into sections');
    }

    return improvements;
  }

  // Real-time Content Validation
  async validateComment(text: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    try {
      const [isToxic, sentimentResult] = await Promise.all([
        this.isContentToxic(text),
        this.analyzeSentiment(text),
      ]);

      const issues: string[] = [];
      const suggestions: string[] = [];

      if (isToxic) {
        issues.push('Content contains toxic language');
        suggestions.push('Please rephrase your comment to be more respectful');
      }

      if (sentimentResult.sentiment === 'negative' && sentimentResult.magnitude > 0.7) {
        issues.push('Content appears overly negative');
        suggestions.push('Consider providing constructive feedback');
      }

      if (text.length < 10) {
        issues.push('Comment is too short');
        suggestions.push('Please provide more detailed feedback');
      }

      if (text.length > 500) {
        issues.push('Comment is too long');
        suggestions.push('Please keep comments concise and focused');
      }

      return {
        isValid: issues.length === 0,
        issues,
        suggestions,
      };
    } catch (error) {
      console.error('Comment validation failed:', error);
      return {
        isValid: true,
        issues: [],
        suggestions: [],
      };
    }
  }

  // Content Similarity
  async calculateSimilarity(text1: string, text2: string): Promise<number> {
    try {
      this.ensureInitialized();
      
      if (this.sentimentModel && typeof window !== 'undefined') {
        // Use real TensorFlow.js model
        const embeddings = await this.sentimentModel.embed([text1, text2]);
        const embedding1 = embeddings.arraySync()[0];
        const embedding2 = embeddings.arraySync()[1];
        
        return this.cosineSimilarity(embedding1, embedding2);
      } else {
        // Fallback implementation
        return this.fallbackSimilarity(text1, text2);
      }
    } catch (error) {
      console.error('Similarity calculation failed:', error);
      return 0;
    }
  }

  private fallbackSimilarity(text1: string, text2: string): number {
    // Simple word-based similarity as fallback
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / Math.max(union.size, 1);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < Math.min(vecA.length, vecB.length); i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    return normA === 0 || normB === 0 ? 0 : dotProduct / (normA * normB);
  }

  // Batch Processing
  async batchAnalyzeContent(texts: string[]): Promise<ContentAnalysis[]> {
    try {
      const analyses = await Promise.all(
        texts.map(text => this.analyzeContent(text))
      );
      return analyses;
    } catch (error) {
      console.error('Batch content analysis failed:', error);
      return texts.map(() => ({
        toxicity: [],
        sentiment: { sentiment: 'neutral', score: 0, magnitude: 0 },
        readabilityScore: 0,
        suggestedImprovements: [],
      }));
    }
  }

  // Content Quality Score
  async getContentQualityScore(text: string): Promise<{
    overallScore: number;
    breakdown: {
      toxicity: number;
      sentiment: number;
      readability: number;
      length: number;
    };
  }> {
    try {
      const analysis = await this.analyzeContent(text);
      const toxicityScore = analysis.toxicity.length > 0 ? 0 : 100;
      const sentimentScore = analysis.sentiment.magnitude < 0.5 ? 100 : 50;
      const readabilityScore = analysis.readabilityScore;
      const lengthScore = text.length >= 50 && text.length <= 1000 ? 100 : 50;
      
      const overallScore = (toxicityScore + sentimentScore + readabilityScore + lengthScore) / 4;
      
      return {
        overallScore,
        breakdown: {
          toxicity: toxicityScore,
          sentiment: sentimentScore,
          readability: readabilityScore,
          length: lengthScore,
        },
      };
    } catch (error) {
      console.error('Quality scoring failed:', error);
      return {
        overallScore: 50,
        breakdown: {
          toxicity: 50,
          sentiment: 50,
          readability: 50,
          length: 50,
        },
      };
    }
  }
}

export const tensorflowAI = new TensorFlowAI();
export default tensorflowAI;
