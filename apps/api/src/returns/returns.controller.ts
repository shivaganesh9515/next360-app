import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  NotFoundException,
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

  @Get('refunds')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findRefunds() {
    return this.returnsService.findRefunds();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  async findOne(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
  ) {
    const ret = await this.returnsService.findOne(id);
    // PII FIX: Non-admin users can only view their own returns. Without this,
    // any authenticated user can fetch any return by UUID and access PII
    // (name, email, phone) of other users. RolesGuard without @Roles()
    // returns true for any authenticated user, so the controller must
    // enforce ownership here.
    if (user.role !== 'ADMIN' && ret.userId !== user.id) {
      throw new NotFoundException('Return request not found');
    }
    return ret;
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  process(@Param('id') id: string, @Body() dto: ProcessReturnDto) {
    return this.returnsService.process(id, dto);
  }
}
