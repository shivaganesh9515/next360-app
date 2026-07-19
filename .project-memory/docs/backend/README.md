# Backend Docs

Detailed backend documentation for reference.

## Module Pattern
```typescript
// module.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [SomeController],
  providers: [SomeService],
  exports: [SomeService],
})
export class SomeModule {}

// some.controller.ts
@Controller('some')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SomeController {
  constructor(private readonly someService: SomeService) {}
}

// some.service.ts
@Injectable()
export class SomeService {
  constructor(private prisma: PrismaService) {}
}
```

## DTO Pattern
```typescript
// create-something.dto.ts
import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateSomethingDto {
  @IsString()
  name: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
```

## Admin Route Pattern
```typescript
@Get('admin-route')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async adminMethod(@CurrentUser('id') adminId: string) {
  const result = await this.service.doSomething();
  this.auditService.log({
    adminId,
    action: 'SOME_ACTION',
    resource: 'SomeResource',
    resourceId: result.id,
  });
  return result;
}
```
