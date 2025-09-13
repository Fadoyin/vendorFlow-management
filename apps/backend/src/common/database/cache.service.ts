import { Injectable, Logger, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
  namespace?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL = 300; // 5 minutes
  private readonly keyPrefix = 'vendorflow:';

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /**
   * Generate cache key with namespace
   */
  private generateKey(key: string, namespace?: string): string {
    const ns = namespace ? `${namespace}:` : '';
    return `${this.keyPrefix}${ns}${key}`;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, options.namespace);
      const cached = await this.redis.get(cacheKey);
      
      if (!cached) {
        return null;
      }

      const data = JSON.parse(cached);
      this.logger.debug(`Cache hit: ${cacheKey}`);
      
      return data;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set cache data
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {},
  ): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, options.namespace);
      const ttl = options.ttl || this.defaultTTL;
      
      const serialized = JSON.stringify(data);
      
      await this.redis.setex(cacheKey, ttl, serialized);
      this.logger.debug(`Cache set: ${cacheKey} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, options.namespace);
      await this.redis.del(cacheKey);
      this.logger.debug(`Cache deleted: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}: ${error.message}`);
    }
  }

  /**
   * Clear cache by pattern
   */
  async deletePattern(pattern: string, options: CacheOptions = {}): Promise<void> {
    try {
      const searchPattern = this.generateKey(pattern, options.namespace);
      const keys = await this.redis.keys(searchPattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache pattern deleted: ${searchPattern} (${keys.length} keys)`);
      }
    } catch (error) {
      this.logger.error(`Cache delete pattern error for ${pattern}: ${error.message}`);
    }
  }

  /**
   * Cache wrapper for database queries
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, options);
    
    return result;
  }

  /**
   * Increment counter
   */
  async increment(key: string, options: CacheOptions = {}): Promise<number> {
    try {
      const cacheKey = this.generateKey(key, options.namespace);
      const result = await this.redis.incr(cacheKey);
      
      // Set expiry if this is a new key
      if (result === 1 && options.ttl) {
        await this.redis.expire(cacheKey, options.ttl);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Cache increment error for key ${key}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();
      
      return {
        connected: this.redis.status === 'ready',
        keyCount,
        memoryInfo: this.parseRedisInfo(info),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Cache stats error: ${error.message}`);
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Parse Redis INFO response
   */
  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.error(`Redis health check failed: ${error.message}`);
      return false;
    }
  }
} 