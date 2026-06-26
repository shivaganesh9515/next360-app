import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`,
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 5MB');
    }

    // Generate unique filename
    const ext = file.originalname.split('.').pop() || 'jpg';
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.]/g, '_')
      .toLowerCase()
      .slice(0, 50);
    const fileName = `${folder}/${uuidv4()}-${sanitizedName}`;

    // Upload to Supabase Storage if configured
    if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from('products')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new BadRequestException(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      return { url: urlData.publicUrl };
    }

    // Fallback: return a placeholder (dev mode without Supabase)
    return { url: `https://via.placeholder.com/400?text=${encodeURIComponent(file.originalname)}` };
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: string = 'products',
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results = await Promise.all(
      files.map((file) => this.uploadImage(file, folder)),
    );

    return { urls: results.map((r) => r.url) };
  }

  async deleteImage(url: string): Promise<void> {
    if (!this.supabase) return;

    // Extract file path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Find the bucket name in the path
    const bucketIndex = pathParts.findIndex(
      (p) => p === 'object' || p === 'public',
    );
    if (bucketIndex === -1) return;

    // Everything after the bucket name is the file path
    const filePath = pathParts.slice(bucketIndex + 2).join('/');

    const { error } = await this.supabase.storage
      .from('products')
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete image:', error.message);
    }
  }
}
