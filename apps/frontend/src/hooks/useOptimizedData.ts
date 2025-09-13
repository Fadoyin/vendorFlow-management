import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, type RequestOptions } from '@/lib/api-client.optimized';

export interface UseDataOptions extends RequestOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  initialData?: any;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

export interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
  isStale: boolean;
  lastUpdated: Date | null;
}

// Cache for storing query results
const queryCache = new Map<string, {
  data: any;
  timestamp: number;
  staleTime: number;
}>();

// Active queries to prevent duplicate requests
const activeQueries = new Map<string, Promise<any>>();

export function useOptimizedData<T = any>(
  queryKey: string | string[],
  queryFn: () => Promise<T>,
  options: UseDataOptions = {}
): UseDataResult<T> {
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
    initialData,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    refetchOnWindowFocus = true,
    ...requestOptions
  } = options;

  const [data, setData] = useState<T | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const queryKeyString = Array.isArray(queryKey) ? queryKey.join('|') : queryKey;
  const intervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Check if data is stale
  const isStale = useCallback(() => {
    const cached = queryCache.get(queryKeyString);
    if (!cached) return true;
    
    return Date.now() - cached.timestamp > cached.staleTime;
  }, [queryKeyString]);

  // Execute query function
  const executeQuery = useCallback(async (force = false): Promise<void> => {
    if (!enabled) return;

    try {
      // Check cache first if not forcing
      if (!force) {
        const cached = queryCache.get(queryKeyString);
        if (cached && !isStale()) {
          if (isMountedRef.current) {
            setData(cached.data);
            setLastUpdated(new Date(cached.timestamp));
            setLoading(false);
            setError(null);
          }
          return;
        }
      }

      // Check if query is already in progress
      let queryPromise = activeQueries.get(queryKeyString);
      
      if (!queryPromise || force) {
        setLoading(true);
        setError(null);

        queryPromise = queryFn();
        activeQueries.set(queryKeyString, queryPromise);
      }

      const result = await queryPromise;

      if (isMountedRef.current) {
        setData(result);
        setLastUpdated(new Date());
        setLoading(false);
        setError(null);

        // Cache the result
        queryCache.set(queryKeyString, {
          data: result,
          timestamp: Date.now(),
          staleTime,
        });

        onSuccess?.(result);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorMessage = err.message || 'An error occurred while fetching data';
        setError(errorMessage);
        setLoading(false);
        onError?.(err);
      }
    } finally {
      activeQueries.delete(queryKeyString);
    }
  }, [enabled, queryKeyString, queryFn, onSuccess, onError, staleTime, isStale]);

  // Manual refetch function
  const refetch = useCallback(async (): Promise<void> => {
    await executeQuery(true);
  }, [executeQuery]);

  // Optimistic update function
  const mutate = useCallback((newData: T): void => {
    setData(newData);
    setLastUpdated(new Date());
    
    // Update cache
    queryCache.set(queryKeyString, {
      data: newData,
      timestamp: Date.now(),
      staleTime,
    });
  }, [queryKeyString, staleTime]);

  // Initial data fetch
  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        executeQuery();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, executeQuery]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (isStale()) {
        executeQuery();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, executeQuery, isStale]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    isStale: isStale(),
    lastUpdated,
  };
}

// Specialized hooks for common data patterns
export function useInventoryData(params?: any, options?: UseDataOptions) {
  return useOptimizedData(
    ['inventory', JSON.stringify(params)],
    async () => {
      const response = await apiClient.get('/inventory', params, {
        cache: true,
        cacheTTL: 300000, // 5 minutes
        ...options,
      });
      return response.data;
    },
    options
  );
}

export function useOrdersData(params?: any, options?: UseDataOptions) {
  return useOptimizedData(
    ['orders', JSON.stringify(params)],
    async () => {
      const response = await apiClient.get('/orders', params, {
        cache: true,
        cacheTTL: 60000, // 1 minute
        ...options,
      });
      return response.data;
    },
    options
  );
}

export function useVendorsData(params?: any, options?: UseDataOptions) {
  return useOptimizedData(
    ['vendors', JSON.stringify(params)],
    async () => {
      const response = await apiClient.get('/vendors', params, {
        cache: true,
        cacheTTL: 300000, // 5 minutes
        ...options,
      });
      return response.data;
    },
    options
  );
}

export function useDashboardStats(options?: UseDataOptions) {
  return useOptimizedData(
    'dashboard-stats',
    async () => {
      const response = await apiClient.get('/dashboard/stats', undefined, {
        cache: true,
        cacheTTL: 60000, // 1 minute
        ...options,
      });
      return response.data;
    },
    {
      refetchInterval: 60000, // Auto-refresh every minute
      ...options,
    }
  );
}

// Mutation hook for create/update/delete operations
export function useOptimizedMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
    invalidateQueries?: string[];
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      
      setData(result);
      options.onSuccess?.(result, variables);

      // Invalidate related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          // Remove from cache to force refetch
          for (const key of queryCache.keys()) {
            if (key.includes(queryKey)) {
              queryCache.delete(key);
            }
          }
        });
      }

      options.onSettled?.(result, null, variables);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Mutation failed';
      setError(errorMessage);
      options.onError?.(err, variables);
      options.onSettled?.(undefined, err, variables);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    mutate,
    loading,
    error,
    data,
    reset,
  };
}

// Utility function to invalidate queries
export function invalidateQueries(queryKeys: string[]): void {
  queryKeys.forEach(queryKey => {
    for (const key of queryCache.keys()) {
      if (key.includes(queryKey)) {
        queryCache.delete(key);
      }
    }
  });
}

// Clear all cached data
export function clearQueryCache(): void {
  queryCache.clear();
  activeQueries.clear();
} 