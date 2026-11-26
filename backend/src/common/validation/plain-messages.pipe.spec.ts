import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { PlainMessagesValidationPipe } from './plain-messages.pipe.js';

class Child {
  @IsString({ message: 'Informe o nome' })
  @IsNotEmpty({ message: 'Informe o nome' })
  nome: string;
}

class Parent {
  @IsString({ message: 'Informe o título' })
  titulo: string;

  @ValidateNested()
  @Type(() => Child)
  filho: Child;
}

async function messagesFor(body: unknown): Promise<unknown> {
  const pipe = new PlainMessagesValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  try {
    await pipe.transform(body, { type: 'body', metatype: Parent });
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (
      (error as BadRequestException).getResponse() as { message: unknown }
    ).message;
  }
  throw new Error('deveria ter recusado');
}

describe('PlainMessagesValidationPipe', () => {
  it('mostra a mensagem do campo aninhado sem o caminho do pai', async () => {
    expect(await messagesFor({ titulo: 'x', filho: { nome: '' } })).toEqual([
      'Informe o nome',
    ]);
  });

  it('mantém as mensagens dos campos do primeiro nível', async () => {
    expect(await messagesFor({ filho: { nome: 'Ana' } })).toEqual([
      'Informe o título',
    ]);
  });

  it('aceita o corpo válido e devolve a instância', async () => {
    const pipe = new PlainMessagesValidationPipe({ transform: true });

    const result = (await pipe.transform(
      { titulo: 'x', filho: { nome: 'Ana' } },
      { type: 'body', metatype: Parent },
    )) as Parent;

    expect(result).toBeInstanceOf(Parent);
    expect(result.filho).toBeInstanceOf(Child);
  });
});
