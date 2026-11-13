import { makeProducer } from '@test/factories';
import sharp from 'sharp';
import type { CreateProducerDto } from '../../src/modules/users/dto/create-producer.dto.js';
import type { TestApp } from './test-app.js';

/** Campos válidos do cadastro de produto (multipart da HU15). */
export const validProduct = {
  nome: 'Cesta da estação',
  categoria: 'Produtos',
  descricao: 'Hortaliças frescas cultivadas sem agrotóxicos.',
  precoPorUnidade: '40.5',
  gramasPorUnidade: '500',
};

export type ProductFields = Partial<typeof validProduct>;

/** Foto mínima aceita pela galeria. */
export function samplePhoto(): Promise<Buffer> {
  return sharp({
    create: { width: 64, height: 64, channels: 3, background: '#3a6' },
  })
    .jpeg()
    .toBuffer();
}

/** Cadastra um produtor pela API e devolve o id e o token. */
export async function registerProducer(
  t: TestApp,
  overrides: Partial<CreateProducerDto> = {},
) {
  const dto = makeProducer(overrides);
  const created = await t
    .request()
    .post('/api/v1/users/producers')
    .send(dto)
    .expect(201);
  const login = await t
    .request()
    .post('/api/v1/auth/login')
    .send({ email: dto.email, senha: dto.senha })
    .expect(200);
  return {
    id: created.body.id as string,
    dto,
    auth: `Bearer ${login.body.accessToken as string}`,
  };
}

/** Cadastra um produto pela API, como o produtor faz na HU15. */
export async function createProduct(
  t: TestApp,
  auth: string,
  photo: Buffer,
  fields: ProductFields = {},
) {
  let req = t.request().post('/api/v1/products').set('Authorization', auth);
  for (const [name, value] of Object.entries({ ...validProduct, ...fields }))
    req = req.field(name, value);
  const res = await req.attach('fotos', photo, 'foto.jpg').expect(201);
  return res.body as { id: string; nome: string };
}
