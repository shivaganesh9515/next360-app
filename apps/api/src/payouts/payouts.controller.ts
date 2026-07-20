import { Controller, Get, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { PayoutsService } from "./payouts.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("payouts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get()
  async findAll(@Query("status") status?: string, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.payoutsService.findAll(status, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get("vendors")
  async findVendorPayouts(@Query("vendorId") vendorId?: string, @Query("status") status?: string, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.payoutsService.findVendorPayouts(vendorId, status, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get("delivery")
  async findDeliveryPayouts(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.payoutsService.findDeliveryPayouts(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get("summary")
  async getSummary() {
    return this.payoutsService.getSummary();
  }

  @Patch(":id/status")
  async updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.payoutsService.updateStatus(id, status);
  }
}
