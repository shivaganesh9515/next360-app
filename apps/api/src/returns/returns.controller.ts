import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto, ProcessReturnDto } from './dto/return.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateReturnDto) {
    return this.returnsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.returnsService.findAll(user.id, user.role);
  }

  // Vendor-specific returns
  @Get('vendor')
  @UseGuards(RolesGuard)
  @Roles('VENDOR')
  findVendorReturns(@CurrentUser() user: any) {
    return this.returnsService.findAll(user.id, 'ADMIN'); // Admins see all, vendors see all
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.returnsService.findOne(id);
  }

  @Patch(':id')
  process(@Param('id') id: string, @Body() dto: any) {
    return this.returnsService.process(id, {
      status: dto.status,
      rejectionReason: dto.reason,
    });
  }
}
