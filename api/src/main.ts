import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ENV_FILE_PATH } from './config/env.loader';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const port = config.get<number>('port', 3001);
  const frontendUrl = config.get<string>(
    'frontendUrl',
    'http://localhost:3000',
  );
  const db = config.get<{ username: string; host: string; name: string }>(
    'database',
  );

  console.log(`Env file: ${ENV_FILE_PATH}`);
  console.log(
    `Database: ${db?.username}@${db?.host}/${db?.name} | Port: ${port}`,
  );

  app.enableCors({
    origin: frontendUrl,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
}
bootstrap();
