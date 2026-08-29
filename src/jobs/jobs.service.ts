import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateJobDto } from './dtos/create-job.dto';
import { UpdateJobDto } from './dtos/update-job.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'generated/prisma/client';

@Injectable()
export class JobsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateJobDto) {
    return this.prismaService.job.create({
      data: {
        ...dto,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });
  }

  async findAll(page = 1, limit = 10, search?: string, type?: string) {
    const skip = (page - 1) * limit;

    const where: any = { status: 'open' };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const [jobs, total] = await Promise.all([
      this.prismaService.job.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              headline: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.job.count({ where }),
    ]);

    return {
      jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const job = await this.prismaService.job.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async update(id: string, userId: string, dto: UpdateJobDto) {
    const job = await this.prismaService.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    return this.prismaService.job.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const job = await this.prismaService.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    await this.prismaService.job.delete({ where: { id } });
    return { message: 'Job deleted successfully' };
  }

  async apply(jobId: string, userId: string, coverLetter?: string) {
    const job = await this.prismaService.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.userId === userId) {
      throw new BadRequestException('You cannot apply to your own job');
    }

    const existingApplication =
      await this.prismaService.jobApplication.findUnique({
        where: { userId_jobId: { userId, jobId } },
      });

    if (existingApplication) {
      throw new BadRequestException('You have already applied to this job');
    }

    return this.prismaService.jobApplication.create({
      data: {
        userId,
        jobId,
        coverLetter,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getApplications(jobId: string, userId: string) {
    const job = await this.prismaService.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException(
        'You can only view applications for your own jobs',
      );
    }

    return this.prismaService.jobApplication.findMany({
      where: { jobId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyJobs(userId: string) {
    return this.prismaService.job.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyApplications(userId: string) {
    return this.prismaService.jobApplication.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: { applications: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateApplicationStatus(
    jobId: string,
    applicationId: string,
    userId: string,
    status: 'pending' | 'accepted' | 'rejected',
  ) {
    const job = await this.prismaService.job.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId)
      throw new ForbiddenException(
        'You can only update applications for your own jobs',
      );

    const application = await this.prismaService.jobApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application || application.jobId !== jobId) {
      throw new NotFoundException('Application not found');
    }

    const updated = await this.prismaService.jobApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
          },
        },
        job: { select: { id: true, title: true } },
      },
    });

    try {
      await this.notificationsService.create(
        updated.userId,
        NotificationType.job_application,
        userId,
        `your application for ${updated.job.title} was ${status}`,
        `/jobs/${jobId}`,
      );
    } catch {
      // Ignored if notification creation fails
    }

    return updated;
  }
}
