#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Display usage information
usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo -e "  ./run.sh <mode> <command> [options]"
    echo ""
    echo -e "${BLUE}Modes:${NC}"
    echo -e "  ${GREEN}dev${NC}   - Run in development mode"
    echo -e "  ${GREEN}prod${NC}  - Run in production mode"
    echo ""
    echo -e "${BLUE}Common Commands:${NC}"
    echo -e "  ${GREEN}up${NC}       - Create and start containers"
    echo -e "  ${GREEN}down${NC}     - Stop and remove containers"
    echo -e "  ${GREEN}start${NC}    - Start existing containers"
    echo -e "  ${GREEN}stop${NC}     - Stop running containers"
    echo -e "  ${GREEN}restart${NC}  - Restart containers"
    echo -e "  ${GREEN}logs${NC}     - View container logs"
    echo -e "  ${GREEN}ps${NC}       - List containers"
    echo -e "  ${GREEN}build${NC}    - Build or rebuild services"
    echo -e "  ${GREEN}pull${NC}     - Pull service images"
    echo -e "  ${GREEN}exec${NC}     - Execute command in a running container"
    echo ""
    echo -e "${BLUE}Common Options:${NC}"
    echo -e "  ${GREEN}-d, --detach${NC}       - Run containers in background"
    echo -e "  ${GREEN}--build${NC}            - Build images before starting"
    echo -e "  ${GREEN}--force-recreate${NC}   - Recreate containers"
    echo -e "  ${GREEN}-f${NC}                 - Follow log output"
    echo -e "  ${GREEN}--tail=N${NC}           - Show last N lines of logs"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo -e "  ${YELLOW}# Start development environment in background${NC}"
    echo -e "  ./run.sh dev up -d"
    echo ""
    echo -e "  ${YELLOW}# Start development with rebuild${NC}"
    echo -e "  ./run.sh dev up -d --build"
    echo ""
    echo -e "  ${YELLOW}# Start production environment${NC}"
    echo -e "  ./run.sh prod up -d --build"
    echo ""
    echo -e "  ${YELLOW}# View logs${NC}"
    echo -e "  ./run.sh dev logs -f"
    echo -e "  ./run.sh prod logs backend --tail=100"
    echo ""
    echo -e "  ${YELLOW}# Stop and remove containers${NC}"
    echo -e "  ./run.sh dev down"
    echo ""
    echo -e "  ${YELLOW}# Execute command in container${NC}"
    echo -e "  ./run.sh dev exec backend npm run migrate"
    echo -e "  ./run.sh prod exec backend sh"
    echo ""
    echo -e "  ${YELLOW}# Rebuild specific service${NC}"
    echo -e "  ./run.sh dev build backend"
    echo ""
}

# Check if docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}Error: Docker daemon is not running${NC}"
        exit 1
    fi
}

# Check if .env file exists, if not copy from .env.example
check_env() {
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            echo -e "${YELLOW}Warning: .env file not found${NC}"
            echo -e "${BLUE}Creating .env from .env.example...${NC}"
            cp .env.example .env
            echo -e "${GREEN}Created .env file. Please update it with your configuration.${NC}"
            echo ""
        else
            echo -e "${YELLOW}Warning: No .env or .env.example file found${NC}"
        fi
    fi
}

# Main script logic
main() {
    # Check if docker is available
    check_docker

    # If no arguments provided, show usage
    if [ $# -eq 0 ]; then
        usage
        exit 0
    fi

    # Get mode (dev or prod)
    MODE=$1
    shift

    # Validate mode
    if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
        echo -e "${RED}Error: Invalid mode '$MODE'${NC}"
        echo -e "Mode must be either 'dev' or 'prod'"
        echo ""
        usage
        exit 1
    fi

    # Check for command
    if [ $# -eq 0 ]; then
        echo -e "${RED}Error: No command specified${NC}"
        echo ""
        usage
        exit 1
    fi

    # Check environment file
    check_env

    # Set docker-compose file based on mode
    if [ "$MODE" == "dev" ]; then
        COMPOSE_FILE="docker-compose.yml"
        ENV_MODE="development"
        echo -e "${BLUE}Running in ${GREEN}DEVELOPMENT${BLUE} mode${NC}"
    else
        COMPOSE_FILE="docker-compose.prod.yml"
        ENV_MODE="production"
        echo -e "${BLUE}Running in ${GREEN}PRODUCTION${BLUE} mode${NC}"
    fi

    # Export NODE_ENV
    export NODE_ENV=$ENV_MODE

    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}Error: Docker compose file '$COMPOSE_FILE' not found${NC}"
        exit 1
    fi

    # Build the docker-compose command
    COMPOSE_CMD="docker compose -f $COMPOSE_FILE"

    # Get all remaining arguments (command + options)
    COMMAND="$@"

    # Execute docker-compose command
    echo -e "${BLUE}Executing:${NC} $COMPOSE_CMD $COMMAND"
    echo ""

    $COMPOSE_CMD $COMMAND
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo ""
        echo -e "${GREEN}Command completed successfully${NC}"
    else
        echo ""
        echo -e "${RED}Command failed with exit code $EXIT_CODE${NC}"
    fi

    exit $EXIT_CODE
}

# Run main function
main "$@"
