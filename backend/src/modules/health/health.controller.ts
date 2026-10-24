import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
  ) {}

  /**
   * Readiness: só responde 200 quando o MongoDB está acessível.
   * Usado pelo Caddy (tráfego) e por monitors externos.
   */
  @Get()
  @HealthCheck()
  ready() {
    return this.health.check([() => this.mongoose.pingCheck('mongodb')]);
  }

  @Get('ready')
  @HealthCheck()
  readyAlias() {
    return this.health.check([() => this.mongoose.pingCheck('mongodb')]);
  }

  /**
   * Liveness: responde 200 enquanto o processo está de pé.
   * Usado pelo HEALTHCHECK do Docker; não reinicia a API por causa do banco.
   */
  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }
}
