import apiClient from '../../api/client';

const ADMIN_SECRET = 'PrinsGo_Session_Secret_2026_#AbC456xyz';

/**
 * Centralized Canonical Admin CMS Helper
 * Ensures all Admin CMS save operations format dual scalar + array payloads,
 * attach the required x-admin-secret header, await verified MongoDB writes,
 * and handle error states gracefully.
 */
export const updateAdminCmsSettings = async (formValues) => {
  const {
    about = '',
    terms = '',
    privacy = '',
    faq = '',
    customerTerms = terms,
    customerPrivacy = privacy,
    customerAbout = about,
    driverTerms = '',
    driverPrivacy = '',
    driverAbout = '',
    faqs = [],
    cmsPages = [],
    supportPhone = '',
    supportEmail = '',
    upiId = '',
    qrCodeImageUrl = '',
    ...rest
  } = formValues;

  // Build canonical dual-mapped structure
  const canonicalCmsPages = cmsPages.length > 0 ? cmsPages : [
    { slug: 'about', title: 'About Us', content: about || customerAbout },
    { slug: 'privacy', title: 'Privacy Policy', content: privacy || customerPrivacy },
    { slug: 'terms', title: 'Terms & Conditions', content: terms || customerTerms },
    { slug: 'faq', title: 'Help & FAQs', content: faq }
  ];

  const canonicalFaqs = faqs.length > 0 ? faqs : (faq ? [{ question: 'General Inquiry', answer: faq }] : []);

  const payload = {
    ...rest,
    about: about || customerAbout,
    terms: terms || customerTerms,
    privacy: privacy || customerPrivacy,
    faq: faq,
    customerTerms: customerTerms || terms,
    customerPrivacy: customerPrivacy || privacy,
    customerAbout: customerAbout || about,
    driverTerms,
    driverPrivacy,
    driverAbout,
    cmsPages: canonicalCmsPages,
    faqs: canonicalFaqs,
    supportPhone,
    supportEmail,
    upiId,
    qrCodeImageUrl
  };

  try {
    const res = await apiClient.put('/admin/settings', payload, {
      headers: {
        'x-admin-secret': ADMIN_SECRET,
        'Content-Type': 'application/json'
      }
    });

    if (res.data && res.data.success) {
      return { success: true, settings: res.data.settings, message: res.data.message || 'Settings updated' };
    }
    throw new Error(res.data?.message || 'Failed to persist CMS settings to MongoDB');
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Network error while saving settings';
    return { success: false, error: errorMessage };
  }
};
