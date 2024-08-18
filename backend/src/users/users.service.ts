import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    email: string;
    password: string;
    name?: string;
    organizationId?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    return this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }

  async findByApiKey(apiKey: string) {
    const key = await this.prisma.apiKey.findUnique({
      where: { key: apiKey, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true,
          },
        },
        organization: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!key) {
      return null;
    }

    // Update last used timestamp
    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      user: key.user,
      organization: key.organization,
      apiKey: key,
      subscription: key.organization.subscriptions[0] || null,
    };
  }

  async generateApiKey(userId: string, name?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.organizationId) {
      throw new ConflictException('User must belong to an organization');
    }

    const apiKey = `sk_${randomBytes(32).toString('hex')}`;

    const key = await this.prisma.apiKey.create({
      data: {
        key: apiKey,
        name: name || 'API Key',
        userId,
        organizationId: user.organizationId,
      },
    });

    return {
      id: key.id,
      key: key.key,
      name: key.name,
      createdAt: key.createdAt,
    };
  }

  async revokeApiKey(userId: string, apiKeyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: apiKeyId, userId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false },
    });

    return { message: 'API key revoked successfully' };
  }

  async listApiKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        key: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
