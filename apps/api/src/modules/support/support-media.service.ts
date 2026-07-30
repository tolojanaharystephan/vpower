import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class SupportMediaService {
  private readonly logger = new Logger(SupportMediaService.name);
  private readonly root = join(process.cwd(), 'uploads', 'support');

  async saveVoice(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }): Promise<{ relativePath: string; publicPath: string }> {
    await mkdir(this.root, { recursive: true });
    const ext = this.safeExt(file.mimetype, file.originalname);
    const name = `${randomUUID()}${ext}`;
    const absolute = join(this.root, name);
    await writeFile(absolute, file.buffer);
    this.logger.debug(`Saved voice ${name}`);
    const relativePath = `support/${name}`;
    return {
      relativePath,
      publicPath: `/uploads/${relativePath}`,
    };
  }

  resolveAbsolute(relativeOrPublic: string): string {
    const cleaned = relativeOrPublic
      .replace(/^\/uploads\//, '')
      .replace(/^uploads\//, '');
    return join(process.cwd(), 'uploads', cleaned);
  }

  private safeExt(mimetype: string, original: string): string {
    const fromName = extname(original).toLowerCase();
    if (fromName && fromName.length <= 5) return fromName;
    if (mimetype.includes('webm')) return '.webm';
    if (mimetype.includes('ogg')) return '.ogg';
    if (mimetype.includes('mpeg') || mimetype.includes('mp3')) return '.mp3';
    if (mimetype.includes('wav')) return '.wav';
    if (mimetype.includes('mp4') || mimetype.includes('m4a')) return '.m4a';
    return '.webm';
  }
}
