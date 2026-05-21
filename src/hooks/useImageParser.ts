import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ParseType = 'business_card' | 'invoice' | 'order' | 'receipt' | 'product_list' | 'notes';

interface ParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  raw_response?: string;
}

export function useImageParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseImage = async <T = any>(
    file: File,
    parseType: ParseType,
    context?: Record<string, string>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:image/...;base64, prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error: fnError } = await supabase.functions.invoke('parse-image', {
        body: { image_base64: base64, parse_type: parseType, context },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to parse image');
      }

      const result = data as ParseResult<T>;

      if (!result.success) {
        throw new Error(result.error || 'Parsing failed');
      }

      return result.data || null;
    } catch (err: any) {
      const message = err.message || 'Failed to parse image';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { parseImage, isLoading, error };
}
