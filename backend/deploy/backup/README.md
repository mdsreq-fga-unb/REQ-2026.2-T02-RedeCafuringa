# Backup e restore

A documentação operacional (instalação do timer, `age`, OCI Object Storage,
drill de restore, migração 8.3→8.0 e criação do usuário de app) está em:

**[`docs/backend/operacao.md` → Backup e restore](../../../docs/backend/operacao.md#7-backup-e-restore)**

Scripts deste diretório:

| Arquivo | Função |
|---|---|
| `backup.sh` | `mongodump` gzip + SHA-256 + `age` opcional + OCI opcional + retenção |
| `restore.sh` | restore em banco separado para drill |
| `cafuringa-backup.service` | unit systemd oneshot |
| `cafuringa-backup.timer` | agenda diária 03:15 UTC |
