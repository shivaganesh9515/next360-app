import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { VendorsModule } from './vendors/vendors.module';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';
import { AddressesModule } from './addresses/addresses.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CouponsModule } from './coupons/coupons.module';
import { OffersModule } from './offers/offers.module';
import { ReturnsModule } from './returns/returns.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { CommissionModule } from './commission/commission.module';
import { BrandsModule } from './brands/brands.module';
import { KycModule } from './kyc/kyc.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { RolesModule } from './roles/roles.module';
import { CmsModule } from './cms/cms.module';
import { InventoryModule } from './inventory/inventory.module';
import { AiModule } from './ai/ai.module';
import { SeedModule } from './seed/seed.module';
import { DeliveryPartnersModule } from './delivery-partners/delivery-partners.module';
import { ZonesModule } from './zones/zones.module';
import { DisputesModule } from './disputes/disputes.module';
import { DeliveryModule } from './delivery/delivery.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { DeliverySlotModule } from './delivery-slot/delivery-slot.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'auth',
        ttl: 60000,
        limit: 5,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    VendorsModule,
    ProductsModule,
    UploadModule,
    AddressesModule,
    CartModule,
    WishlistModule,
    ReviewsModule,
    CouponsModule,
    OffersModule,
    ReturnsModule,
    NotificationsModule,
    OrdersModule,
    PaymentsModule,
    CommissionModule,
    BrandsModule,
    KycModule,
    SubCategoriesModule,
    RolesModule,
    CmsModule,
    InventoryModule,
    AiModule,
    SeedModule,
    DeliveryPartnersModule,
    ZonesModule,
    DisputesModule,
    AuditModule,
    AdminModule,
    DeliverySlotModule,
    DeliveryModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
