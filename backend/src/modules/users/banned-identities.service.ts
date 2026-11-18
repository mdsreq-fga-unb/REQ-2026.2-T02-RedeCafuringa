import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { PiiCipher } from '../../common/crypto/pii-cipher.js';
import { BannedIdentity } from './schemas/banned-identity.schema.js';

/** Identificadores de uma pessoa, já como o cadastro os guarda. */
export type Identity = { cpfHash?: string; cnpjHash?: string; email?: string };

/**
 * Banimento impede um novo cadastro da mesma pessoa (CPF, CNPJ ou
 * e-mail). Guarda e compara só hashes (ver BannedIdentity).
 */
@Injectable()
export class BannedIdentitiesService {
  constructor(
    @InjectModel(BannedIdentity.name)
    private readonly banned: Model<BannedIdentity>,
    private readonly cipher: PiiCipher,
  ) {}

  async ban(identity: Identity): Promise<void> {
    const banidoEm = new Date();
    const ops = this.entries(identity).map(([tipo, hash]) => ({
      updateOne: {
        filter: { hash },
        update: { $setOnInsert: { tipo, hash, banidoEm } },
        upsert: true,
      },
    }));
    if (ops.length) await this.banned.bulkWrite(ops);
  }

  async isBanned(identity: Identity): Promise<boolean> {
    const hashes = this.entries(identity).map(([, hash]) => hash);
    if (!hashes.length) return false;
    return !!(await this.banned.exists({ hash: { $in: hashes } }).exec());
  }

  private entries(identity: Identity): Array<[BannedIdentity['tipo'], string]> {
    const list: Array<[BannedIdentity['tipo'], string]> = [];
    if (identity.cpfHash) list.push(['cpf', identity.cpfHash]);
    if (identity.cnpjHash) list.push(['cnpj', identity.cnpjHash]);
    if (identity.email)
      list.push([
        'email',
        // Prefixo: o mesmo texto nunca colide com o hash de um documento.
        this.cipher.blindIndex(`email:${identity.email.trim().toLowerCase()}`),
      ]);
    return list;
  }
}
