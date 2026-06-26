import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
})
export class AppModule {}
