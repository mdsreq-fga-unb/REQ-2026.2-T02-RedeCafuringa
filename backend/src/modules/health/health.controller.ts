import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator.js';

// As respostas 200 e 503 (e seus schemas) vêm do próprio @HealthCheck() do Terminus.
@ApiTags('health')
@Public()
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
  @ApiOperation({
    summary: 'Prontidão (alias de /health/ready)',
    description: 'Responde 200 só quando o MongoDB está acessível.',
  })
  ready() {
    return this.health.check([() => this.mongoose.pingCheck('mongodb')]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Prontidão',
    description:
      'Responde 200 só quando o MongoDB está acessível. Usado pelo proxy (tráfego) e por monitores externos.',
  })
  readyAlias() {
    return this.health.check([() => this.mongoose.pingCheck('mongodb')]);
  }

  /**
   * Liveness: responde 200 enquanto o processo está de pé.
   * Usado pelo HEALTHCHECK do Docker; não reinicia a API por causa do banco.
   */
  @Get('live')
  @HealthCheck()
  @ApiOperation({
    summary: 'Vivacidade',
    description:
      'Responde 200 enquanto o processo está de pé, sem consultar o banco. Usado pelo HEALTHCHECK do Docker.',
  })
  live() {
    return this.health.check([]);
  }
}
