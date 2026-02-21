#!/usr/bin/env bash
# Install Docker Compose plugin by adding Docker's official APT repository.
# Run with: bash scripts/install-docker-compose-plugin.sh
# Requires: sudo (you will be prompted for your password)

set -e

# Detect distro for correct Docker repo (Ubuntu vs Debian)
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO_ID="${ID:-unknown}"
else
  DISTRO_ID="ubuntu"
fi

case "$DISTRO_ID" in
  ubuntu) DOCKER_DISTRO="ubuntu" ;;
  debian) DOCKER_DISTRO="debian" ;;
  *)      DOCKER_DISTRO="ubuntu" ;;  # default
esac

echo "Detected distro: $DISTRO_ID -> using Docker repo for $DOCKER_DISTRO"

# 1. Prerequisites and Docker repo
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL "https://download.docker.com/linux/${DOCKER_DISTRO}/gpg" | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${DOCKER_DISTRO} $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 2. Install plugin
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# 3. Verify
echo ""
echo "Installation complete. Verifying:"
docker compose version
