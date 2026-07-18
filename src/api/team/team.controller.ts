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

import { TeamService } from './team.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';

@Controller('teams')
export class TeamController {
  public constructor(private readonly teamService: TeamService) {}

  @Get()
  public list() {
    return this.teamService.list();
  }

  @Authorization()
  @Post()
  public create(@Body() dto: CreateTeamDto) {
    return this.teamService.create(dto);
  }

  @Authorization()
  @Patch(':id')
  public update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamService.update(id, dto);
  }

  @Authorization()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}
