import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { Authorization } from '../../common/decorators/authorization.decorator';

import { DayService } from './day.service';
import { CreateDayDto, UpdateDayDto } from './dto/day.dto';

@Controller('days')
export class DayController {
  public constructor(private readonly dayService: DayService) {}

  @Get()
  public list() {
    return this.dayService.list();
  }

  @Authorization()
  @Post()
  public create(@Body() dto: CreateDayDto) {
    return this.dayService.create(dto);
  }

  @Authorization()
  @Patch(':id')
  public update(@Param('id') id: string, @Body() dto: UpdateDayDto) {
    return this.dayService.update(id, dto);
  }

  @Authorization()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public remove(@Param('id') id: string) {
    return this.dayService.remove(id);
  }
}
