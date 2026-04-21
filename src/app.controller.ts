import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

/**
 * Catch-all controller: serves the React SPA (index.html) for every
 * route that is NOT handled by NestJS API controllers or static assets.
 *
 * This runs AFTER the /api prefix routes, so it only catches
 * frontend routes like /, /present/:code, /join/:code.
 */
@Controller()
export class AppController {
  @Get('*')
  public serveFrontend(@Res() res: Response): void {
    // __dirname at runtime = dist/src → project root is ../..
    const indexPath = join(__dirname, '..', '..', 'build', 'index.html');
    res.sendFile(indexPath);
  }
}
