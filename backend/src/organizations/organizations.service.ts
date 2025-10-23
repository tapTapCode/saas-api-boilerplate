import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; slug: string }) {
    const existing = await this.prisma.organization.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException('Organization slug already exists');
    }

    const organization = await this.prisma.organization.create({
      data,
    });

    // Create a default FREE subscription for the organization
    await this.prisma.subscription.create({
      data: {
        organizationId: organization.id,
        plan: 'FREE',
        status: 'ACTIVE',
        requestLimit: 1000,
        rateLimit: 10,
      },
    });

    return organization;
  }

  async findById(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async getUsageStats(organizationId: string, startDate: Date, endDate: Date) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const usageRecords = await this.prisma.usageRecord.findMany({
      where: {
        organizationId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const totalRequests = usageRecords.length;
    const avgResponseTime =
      usageRecords.reduce((sum, record) => sum + record.responseTime, 0) /
        totalRequests || 0;

    const statusCodeDistribution = usageRecords.reduce((acc, record) => {
      acc[record.statusCode] = (acc[record.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      statusCodeDistribution,
      usageRecords: usageRecords.slice(0, 100), // Latest 100 records
    };
  }
}
