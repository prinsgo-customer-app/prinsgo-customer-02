import { updateAdminCmsSettings } from '../../src/services/admin/adminCmsService';
import apiClient from '../../src/api/client';

jest.mock('../../src/api/client');

describe('adminCmsService canonical persistence helper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('constructs dual scalar + array canonical payload with x-admin-secret header', async () => {
    apiClient.put.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Settings updated',
        settings: { _id: '6a7225dc8a92c26eb4c20df1' }
      }
    });

    const formData = {
      about: 'About PrinsGo test',
      terms: 'Terms test',
      privacy: 'Privacy test',
      faq: 'FAQ test'
    };

    const result = await updateAdminCmsSettings(formData);

    expect(result.success).toBe(true);
    expect(apiClient.put).toHaveBeenCalledWith(
      '/admin/settings',
      expect.objectContaining({
        about: 'About PrinsGo test',
        terms: 'Terms test',
        privacy: 'Privacy test',
        faq: 'FAQ test',
        cmsPages: expect.arrayContaining([
          expect.objectContaining({ slug: 'about', content: 'About PrinsGo test' }),
          expect.objectContaining({ slug: 'terms', content: 'Terms test' }),
          expect.objectContaining({ slug: 'privacy', content: 'Privacy test' })
        ])
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-admin-secret': 'PrinsGo_Session_Secret_2026_#AbC456xyz'
        })
      })
    );
  });

  it('returns failure object on API error', async () => {
    apiClient.put.mockRejectedValueOnce({
      response: { data: { message: 'Invalid admin secret key' } }
    });

    const result = await updateAdminCmsSettings({ about: 'Fail test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid admin secret key');
  });
});
