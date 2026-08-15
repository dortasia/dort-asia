export const getCrossAppUrl = (appName: 'xentraPeople' | 'xentraPaynote'): string => {
  if (appName === 'xentraPeople') {
    return process.env.NEXT_PUBLIC_XENTRA_PEOPLE_URL || 'https://xentrapeople.dortasia.com';
  }
  if (appName === 'xentraPaynote') {
    return process.env.NEXT_PUBLIC_XENTRA_PAYNOTE_URL || 'https://xentrapaynote.dortasia.com';
  }
  return '';
};
