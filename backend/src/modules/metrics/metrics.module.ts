import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller.js';
import { MetricsRegistry } from './metrics.registry.js';

@Module({
  controllers: [MetricsController],
  providers: [MetricsRegistry],
  exports: [MetricsRegistry],
})
export class MetricsModule {}
