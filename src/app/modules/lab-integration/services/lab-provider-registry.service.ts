import ApiError from '../../../errors/ApiErrors';
import { AccessLabProvider } from '../providers/access/access-lab.provider';

export class LabProviderRegistryService {
  private readonly providers = new Map<string, AccessLabProvider>([
    ['ACCESS', new AccessLabProvider()],
  ]);

  getByCode(code: string | null | undefined) {
    const normalized = (code || '').trim().toUpperCase();
    const provider = this.providers.get(normalized);
    if (!provider) {
      throw new ApiError(400, `Lab provider ${normalized || 'UNKNOWN'} is not enabled`);
    }

    return provider;
  }
}

export const labProviderRegistryService = new LabProviderRegistryService();
