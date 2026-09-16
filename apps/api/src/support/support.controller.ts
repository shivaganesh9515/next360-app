import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.supportService.create(userId, dto);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@Query('status') status?: string) {
    return this.supportService.findAll(status);
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.supportService.findOne(id, user.id, user.role);
  }

  @Patch('tickets/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async assign(@Param('id') id: string, @Body('adminId') adminId: string) {
    return this.supportService.assign(id, adminId);
  }

  @Post('tickets/:id/reply')
  @UseGuards(JwtAuthGuard)
  async addReply(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body('message') message: string,
  ) {
    return this.supportService.addReply(id, user.id, message, user.role);
  }

  @Patch('tickets/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.supportService.updateStatus(id, status);
  }
}
