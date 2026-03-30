import {
  Controller, Post, Put, Get, Body,
  Param, Query, UseGuards
} from '@nestjs/common';
import { TravelService } from './travel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateItineraryDto, UpdateItineraryDto } from './dto/travel.dto';

@UseGuards(JwtAuthGuard)
@Controller('travel')
export class TravelController {
  constructor(private travelService: TravelService) {}

  // POST /travel/generate-itinerary
  @Post('generate-itinerary')
  generate(@Body() dto: GenerateItineraryDto) {
    return this.travelService.generateItinerary(dto);
  }

  // PUT /travel/itineraries/:id
  @Put('itineraries/:id')
  update(@Param('id') id: string, @Body() dto: UpdateItineraryDto) {
    return this.travelService.updateItinerary(id, dto.updates);
  }

  // GET /travel/itineraries/:id/export
  @Get('itineraries/:id/export')
  export(
    @Param('id') id: string,
    @Query('format') format: 'pdf' | 'json' = 'json',
  ) {
    return this.travelService.exportItinerary(id, format);
  }
}