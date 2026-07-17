import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../infra/prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';

const SALT_ROUNDS = 10;

// Fields returned to callers — never expose the password hash.
const userSelect = {
  id: true,
  nickname: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { nickname: dto.nickname },
    });

    if (existing) {
      throw new ConflictException('Nickname is already taken');
    }

    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        nickname: dto.nickname,
        password,
      },
      select: userSelect,
    });
  }

  public findAll() {
    return this.prisma.user.findMany({ select: userSelect });
  }

  public findByNickname(nickname: string) {
    return this.prisma.user.findUnique({ where: { nickname } });
  }

  public findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: userSelect });
  }
}
