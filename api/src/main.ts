import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ENV_FILE_PATH } from './config/env.loader';

const dim = (text: string) => `\x1b[2m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  const config = app.get(ConfigService);

  const port = config.get<number>('port', 3001);
  const nodeEnv = config.get<string>('nodeEnv', 'development');
  const frontendUrl = config.get<string>(
    'frontendUrl',
    'http://localhost:3000',
  );
  const db = config.get<{ username: string; host: string; name: string }>(
    'database',
  );
  const swaggerEnabled = nodeEnv !== 'production';

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

  if (swaggerEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Monthly Account API')
        .setDescription('API for tracking monthly income and expenses')
        .setVersion('1.0')
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port);

  const baseUrl = `http://localhost:${port}`;
  console.log(`  ${dim('API')}         : ${cyan(baseUrl)}`);
  if (swaggerEnabled) {
    console.log(`  ${dim('Swagger')}     : ${yellow(`${baseUrl}/docs`)}`);
  }
}
bootstrap();
