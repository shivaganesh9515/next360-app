import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto, AddMessageDto, UpdateTicketStatusDto, AssignTicketDto } from './dto/support.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, TicketStatus } from '@prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ─── Customer Routes ────────────────────────────────────────────────────

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  createTicket(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.supportService.createTicket(userId, dto);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  getMyTickets(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getMyTickets(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  getTicketDetail(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.supportService.getTicketDetail(userId, id);
  }

  @Post('tickets/:id/messages')
  @UseGuards(JwtAuthGuard)
  addMessage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.addMessage(userId, id, dto.body);
  }

  // ─── Admin Routes ───────────────────────────────────────────────────────

  @Get('tickets/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllTickets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.supportService.getAllTickets(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
    );
  }

  @Get('tickets/:id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminGetTicketDetail(@Param('id') id: string) {
    return this.supportService.adminGetTicketDetail(id);
  }

  @Post('tickets/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminReply(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.adminReply(adminId, id, dto.body);
  }

  @Patch('tickets/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.supportService.updateStatus(id, dto.status as TicketStatus);
  }

  @Patch('tickets/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  assignTicket(
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
  ) {
    return this.supportService.assignTicket(id, dto.assignedToId);
  }
}
