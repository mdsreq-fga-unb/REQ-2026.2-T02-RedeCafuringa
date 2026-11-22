import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsModule } from '../metrics/metrics.module.js';
import {
  Experience,
  ExperienceSchema,
} from '../experiences/schemas/experience.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';
import { Booking, BookingSchema } from './schemas/booking.schema.js';

/**
 * HU44 — pré-reserva de experiências (CP6). Dados em `bookings`; a experiência
 * e o produtor responsável são lidos de `experiences` e `users`.
 */
@Module({
  imports: [
    MetricsModule,
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Experience.name, schema: ExperienceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
