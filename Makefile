# Makefile for LocalStack and Nitro

# Variables
LOCALSTACK_VERSION := latest
NITRO_VERSION := latest

# Targets
.PHONY: start start-localstack start-app stop stop-localstack stop-app

start: start-localstack start-app
stop: stop-localstack stop-app
deploy-locally: start-localstack build-app localstack-deploy

start-localstack:
	@echo "Starting LocalStack..."
	localstack start -d

localstack-deploy:
	@echo "Locally deploying apps..."
	@localstack wait
	@cd ./apps/server/.output/server && zip -r ./lambda.zip . && cd -
	@cp ./apps/server/.output/server/lambda.zip ./terraform/preview
	@tflocal -chdir=./terraform/preview init
	@tflocal -chdir=./terraform/preview apply --auto-approve

build-app:
	@echo "Building apps..."
	@pnpm install
	@pnpm -r build

start-app:
	@echo "Starting apps..."
	@pnpm install
	@pnpm -r dev

stop-localstack:
	@echo "Stopping LocalStack..."
	@localstack stop

install:
	@which localstack || brew install localstack
	@which awslocal || pip install awscli-local
	@which tflocal || pip install terraform-local
