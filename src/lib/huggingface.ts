// HuggingFace API Integration - Completely Free Models

export interface HuggingFaceResponse {
  generated_text?: string;
  [key: string]: any;
}

export interface ImageGenerationResponse {
  0: string; // Base64 image
}

class HuggingFaceAI {
  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('HuggingFace API key not found in environment variables');
    }
  }

  private async makeRequest(model: string, payload: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${model}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('HuggingFace API request failed:', error);
      throw error;
    }
  }

  // Text Generation Models
  async generateText(prompt: string, maxLength: number = 100): Promise<string> {
    try {
      const response = await this.makeRequest('distilgpt2', {
        inputs: prompt,
        parameters: {
          max_length: maxLength,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
          return_full_text: false,
        },
      });

      return response[0]?.generated_text || '';
    } catch (error) {
      console.error('Text generation failed:', error);
      return '';
    }
  }

  async generateBlogTitle(topic: string): Promise<string[]> {
    try {
      const prompt = `Generate 5 catchy blog titles about: ${topic}`;
      const response = await this.makeRequest('distilgpt2', {
        inputs: prompt,
        parameters: {
          max_length: 150,
          temperature: 0.8,
          num_return_sequences: 5,
          return_full_text: false,
        },
      });

      return response.map((item: any) => item.generated_text.trim()).filter(Boolean);
    } catch (error) {
      console.error('Blog title generation failed:', error);
      return [];
    }
  }

  async generateBlogOutline(topic: string): Promise<string[]> {
    try {
      const prompt = `Create a detailed blog outline about: ${topic}\nOutline:`;
      const response = await this.makeRequest('distilgpt2', {
        inputs: prompt,
        parameters: {
          max_length: 200,
          temperature: 0.6,
          return_full_text: false,
        },
      });

      const outline = response[0]?.generated_text || '';
      return outline.split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().match(/^\d+\./));
    } catch (error) {
      console.error('Blog outline generation failed:', error);
      return [];
    }
  }

  async generateBlogSummary(content: string): Promise<string> {
    try {
      const prompt = `Summarize this blog post in 2-3 sentences:\n\n${content.substring(0, 1000)}\n\nSummary:`;
      const response = await this.makeRequest('distilgpt2', {
        inputs: prompt,
        parameters: {
          max_length: 100,
          temperature: 0.3,
          return_full_text: false,
        },
      });

      return response[0]?.generated_text || '';
    } catch (error) {
      console.error('Blog summarization failed:', error);
      return '';
    }
  }

  async generateTags(content: string): Promise<string[]> {
    try {
      const prompt = `Extract 5 relevant tags from this text:\n\n${content.substring(0, 500)}\n\nTags:`;
      const response = await this.makeRequest('distilgpt2', {
        inputs: prompt,
        parameters: {
          max_length: 50,
          temperature: 0.3,
          return_full_text: false,
        },
      });

      const tagsText = response[0]?.generated_text || '';
      return tagsText.split(',').map((tag: string) => tag.trim().replace('#', '')).filter(Boolean);
    } catch (error) {
      console.error('Tag generation failed:', error);
      return [];
    }
  }

  async generateSEOMetadata(title: string, content: string): Promise<{
    metaDescription: string;
    keywords: string[];
  }> {
    try {
      const metaPrompt = `Generate SEO meta description for this blog:\nTitle: ${title}\nContent: ${content.substring(0, 300)}\n\nMeta Description:`;
      
      const metaResponse = await this.makeRequest('distilgpt2', {
        inputs: metaPrompt,
        parameters: {
          max_length: 160,
          temperature: 0.3,
          return_full_text: false,
        },
      });

      const keywordsPrompt = `Extract 5 SEO keywords for this blog:\nTitle: ${title}\nContent: ${content.substring(0, 300)}\n\nKeywords:`;
      
      const keywordsResponse = await this.makeRequest('distilgpt2', {
        inputs: keywordsPrompt,
        parameters: {
          max_length: 50,
          temperature: 0.3,
          return_full_text: false,
        },
      });

      const metaDescription = metaResponse[0]?.generated_text || '';
      const keywordsText = keywordsResponse[0]?.generated_text || '';
      const keywords = keywordsText.split(',').map((k: string) => k.trim()).filter(Boolean);

      return { metaDescription, keywords };
    } catch (error) {
      console.error('SEO metadata generation failed:', error);
      return { metaDescription: '', keywords: [] };
    }
  }

  async continueWriting(content: string): Promise<string> {
    try {
      const response = await this.makeRequest('distilgpt2', {
        inputs: content,
        parameters: {
          max_length: 150,
          temperature: 0.7,
          return_full_text: false,
        },
      });

      return response[0]?.generated_text || '';
    } catch (error) {
      console.error('Continue writing failed:', error);
      return '';
    }
  }

  async improveWriting(text: string): Promise<string> {
    try {
      const prompt = `Improve the grammar and style of this text:\n\n${text}\n\nImproved:`;
      const response = await this.makeRequest('distilgpt2', {
        inputs: prompt,
        parameters: {
          max_length: Math.max(text.length + 50, 100),
          temperature: 0.3,
          return_full_text: false,
        },
      });

      return response[0]?.generated_text || text;
    } catch (error) {
      console.error('Writing improvement failed:', error);
      return text;
    }
  }

  // Image Generation
  async generateImage(prompt: string, style: string = 'realistic'): Promise<string> {
    try {
      const models = {
        realistic: 'runwayml/stable-diffusion-v1-5',
        artistic: 'stabilityai/stable-diffusion-2-1',
        digital: 'CompVis/stable-diffusion-v1-4',
      };

      const selectedModel = models[style as keyof typeof models] || models.realistic;
      
      const response = await this.makeRequest(selectedModel, {
        inputs: `${prompt}, professional blog cover, high quality, detailed`,
        parameters: {
          guidance_scale: 7.5,
          num_inference_steps: 20,
        },
      });

      // Handle different response formats
      if (response[0] && typeof response[0] === 'string') {
        return response[0]; // Base64 image
      } else if (response.image) {
        return response.image;
      } else {
        throw new Error('Unexpected image generation response format');
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      return '';
    }
  }

  async generateBlogCoverImage(title: string, category: string = 'technology'): Promise<string> {
    try {
      const prompt = `Professional blog cover image about "${title}" in ${category} style, modern, clean design, high quality`;
      return await this.generateImage(prompt, 'realistic');
    } catch (error) {
      console.error('Blog cover generation failed:', error);
      return '';
    }
  }

  // Content Analysis
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
  }> {
    try {
      const response = await this.makeRequest('cardiffnlp/twitter-roberta-base-sentiment-latest', {
        inputs: text,
      });

      const scores = response[0];
      const maxScore = Math.max(...scores.map((s: any) => s.score));
      const sentiment = scores.find((s: any) => s.score === maxScore)?.label || 'neutral';

      return {
        sentiment: sentiment.toLowerCase() as 'positive' | 'negative' | 'neutral',
        score: maxScore,
      };
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return { sentiment: 'neutral', score: 0.5 };
    }
  }

  async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await this.makeRequest('dslim/bert-base-NER', {
        inputs: text,
      });

      const entities = response.flatMap((item: any) => item);
      const keywords = entities
        .filter((entity: any) => entity.score > 0.5)
        .map((entity: any) => entity.word)
        .filter(Boolean);

      return [...new Set(keywords)]; // Remove duplicates
    } catch (error) {
      console.error('Keyword extraction failed:', error);
      return [];
    }
  }

  async classifyContent(text: string): Promise<string[]> {
    try {
      const response = await this.makeRequest('distilbert-base-uncased-finetuned-sst-2-english', {
        inputs: text,
      });

      return response.map((item: any) => item.label).filter((label: unknown): label is string => typeof label === 'string');
    } catch (error) {
      console.error('Content classification failed:', error);
      return [];
    }
  }
}

export const huggingFaceAI = new HuggingFaceAI();
export default huggingFaceAI;
