import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync } from 'fs';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const port = config.getOrThrow<number>('PORT');
  const rawOrigins = config.getOrThrow<string>('CORS_ORIGINS');

  const corsOrigins = rawOrigins.split(',').map((o) => o.trim());

  app.enableCors({ origin: corsOrigins, credentials: true });
  app.setGlobalPrefix('api');

  // Serve session images from src/session/images/ at /images/*
  const imagesPath = join(process.cwd(), 'src', 'session', 'images');
  app.useStaticAssets(imagesPath, { prefix: '/images' });

  // __dirname at runtime = dist/src → project root is ../..
  const buildPath = join(__dirname, '..', '..', 'build');
  const indexHtml = join(buildPath, 'index.html');
  const hasBuild = existsSync(indexHtml);

  if (hasBuild) {
    app.useStaticAssets(buildPath);

    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use((req: Request, res: Response, next: NextFunction) => {
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/socket.io') ||
        req.path.startsWith('/images')
      ) {
        return next();
      }
      res.sendFile(indexHtml);
    });
  } else {
    console.log('  ℹ  No build/ found — running in API-only mode');
    console.log('  ℹ  Open http://localhost:5173 for the frontend\n');
  }

  await app.listen(port);
  console.log(`\n🗳  Poll Presenter → http://localhost:${port}\n`);
}

bootstrap();
