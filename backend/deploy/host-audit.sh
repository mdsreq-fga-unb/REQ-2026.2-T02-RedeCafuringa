#!/usr/bin/env bash
set -euo pipefail

# Auditoria read-only do host OCI. Rode como root ou com sudo.
# Não altera nada; apenas coleta evidência para o runbook.
#
# IMPORTANTE: rode na VM OCI, não no WSL/local. Em WSL, os dados de disco,
# firewall e Docker são da sua máquina de desenvolvimento, não de produção.

if grep -qi microsoft /proc/version 2>/dev/null; then
  echo "AVISO: WSL detectado. Este script é para a VM OCI; os números abaixo NÃO representam produção." >&2
fi

echo "== host =="
hostnamectl 2>/dev/null || true
uname -a

echo "== portas =="
ss -lntp 2>/dev/null || true

echo "== firewall =="
ufw status verbose 2>/dev/null || true
iptables -S 2>/dev/null || true

echo "== disco =="
df -h
df -i

echo "== memória =="
free -m
swapon --show 2>/dev/null || true

echo "== docker =="
docker context show 2>/dev/null || true
docker version 2>/dev/null || true
docker info --format '{{.ServerVersion}} {{.Driver}} {{.LoggingDriver}}' 2>/dev/null || true
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || true
docker system df -v 2>/dev/null || true

echo "== updates =="
apt list --upgradable 2>/dev/null || true

echo "== ssh =="
sshd -T 2>/dev/null | grep -E 'permitrootlogin|passwordauthentication|pubkeyauthentication' || true

echo "== erros recentes =="
journalctl -p 3 -n 50 --no-pager 2>/dev/null || true
