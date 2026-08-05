import { Module } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { GoogleTranslationProvider } from './google.provider';
import { PassthroughTranslationProvider } from './passthrough.provider';
import { TRANSLATION_PROVIDER } from './translation.types';
import { TranslationService } from './translation.service';

@Module({
  providers: [
    {
      provide: TRANSLATION_PROVIDER,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        if (config.translationEnabled && config.googleTranslationApiKey) {
          return new GoogleTranslationProvider(config.googleTranslationApiKey);
        }
        return new PassthroughTranslationProvider();
      },
    },
    TranslationService,
  ],
  exports: [TranslationService],
})
export class TranslationModule {}
