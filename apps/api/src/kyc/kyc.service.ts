import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { VerifyKycDto } from './dto/verify-kyc.dto';
import { KycStatus } from '@prisma/client';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async submit(userId: string, dto: SubmitKycDto) {
    const existing = await this.prisma.kYC.findUnique({ where: { userId } });
    if (existing && existing.status === KycStatus.VERIFIED) {
      throw new ConflictException('KYC is already verified');
    }

    if (existing && existing.status === KycStatus.PENDING) {
      throw new ConflictException('KYC submission is already pending review');
    }

    // Upsert: create or update existing (e.g. re-submit after rejection)
    return this.prisma.kYC.upsert({
      where: { userId },
      update: {
        documentType: dto.documentType,
        documentNumber: dto.documentNumber || null,
        documentUrl: dto.documentUrl || null,
        status: KycStatus.PENDING,
        rejectionReason: null,
        submittedAt: new Date(),
        verifiedAt: null,
      },
      create: {
        userId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber || null,
        documentUrl: dto.documentUrl || null,
        status: KycStatus.PENDING,
      },
    });
  }

  async getByUserId(userId: string) {
    const kyc = await this.prisma.kYC.findUnique({ where: { userId } });
    if (!kyc) throw new NotFoundException('No KYC submission found');
    return kyc;
  }

  async findAll(status?: KycStatus) {
    const where = status ? { status } : {};
    return this.prisma.kYC.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const kyc = await this.prisma.kYC.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } },
      },
    });
    if (!kyc) throw new NotFoundException('KYC record not found');
    return kyc;
  }

  async verify(id: string, dto: VerifyKycDto) {
    await this.findOne(id);

    if (dto.status === KycStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting KYC');
    }

    return this.prisma.kYC.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason || null,
        verifiedAt: dto.status === KycStatus.VERIFIED ? new Date() : null,
      },
    });
  }
}
