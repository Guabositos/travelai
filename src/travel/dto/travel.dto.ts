import { IsString, IsDateString, IsObject, IsOptional } from 'class-validator';

export class GenerateItineraryDto {
  @IsString()
  destination: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsObject()
  @IsOptional()
  preferences: Record<string, any>;
}

export class UpdateItineraryDto {
  @IsObject()
  updates: Record<string, any>;
}