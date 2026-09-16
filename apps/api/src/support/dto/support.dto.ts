import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;
}

export class AddMessageDto {
  @IsString()
  @IsNotEmpty()
  body: string;
}

export class UpdateTicketStatusDto {
  @IsString()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status: string;
}

export class AssignTicketDto {
  @IsString()
  @IsNotEmpty()
  assignedToId: string;
}
