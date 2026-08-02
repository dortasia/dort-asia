export function ssoRedirect(url: string, accessToken: string, refreshToken: string, nextUrl: string = '/') {
  // Create a form to POST the tokens securely so they are not visible in the URL bar
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  form.style.display = 'none';
  
  const tokenInput = document.createElement('input');
  tokenInput.type = 'hidden';
  tokenInput.name = 'access_token';
  tokenInput.value = accessToken;
  form.appendChild(tokenInput);

  const refreshInput = document.createElement('input');
  refreshInput.type = 'hidden';
  refreshInput.name = 'refresh_token';
  refreshInput.value = refreshToken;
  form.appendChild(refreshInput);

  const nextInput = document.createElement('input');
  nextInput.type = 'hidden';
  nextInput.name = 'next';
  nextInput.value = nextUrl;
  form.appendChild(nextInput);

  document.body.appendChild(form);
  form.submit();
}
